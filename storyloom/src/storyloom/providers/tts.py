"""TTSProvider protocol + implementations (SPEC §1.5).

Two real backends to A/B on the same script — ElevenLabs and OpenAI — plus an offline backend that
synthesizes a soft, per-voice tone sized to the text. The offline backend is not speech; it exists
so narrate + master run end-to-end with no keys and so audio assertions (LUFS, duration) have real
audio to measure.

`synthesize` writes an audio file to `out_path` and returns usage (characters billed, seconds).
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Protocol, runtime_checkable

from ..audio.ffmpeg import probe_duration_seconds, run_ffmpeg
from ..config import Settings, get_settings
from ..pipeline.types import TTSUsage

# Rough narration pace for estimating offline segment length (~165 wpm).
_WORDS_PER_SECOND = 2.75
_MIN_SEGMENT_S = 0.6


@runtime_checkable
class TTSProvider(Protocol):
    name: str

    def synthesize(self, *, text: str, voice_id: str, out_path: Path) -> TTSUsage:
        ...


def _voice_frequency(voice_id: str) -> int:
    """Map a voice id to a stable pitch so different characters sound distinct offline."""
    h = int(hashlib.sha256(voice_id.encode()).hexdigest(), 16)
    return 150 + (h % 170)  # 150–320 Hz


class OfflineTTS:
    """Network-free tone synthesis. Deterministic, for dev/CI/audio-assertion tests."""

    name = "offline"

    def synthesize(self, *, text: str, voice_id: str, out_path: Path) -> TTSUsage:
        words = max(1, len(text.split()))
        duration = max(_MIN_SEGMENT_S, round(words / _WORDS_PER_SECOND, 3))
        freq = _voice_frequency(voice_id)
        fade_out_start = max(0.0, duration - 0.08)
        run_ffmpeg(
            [
                "-f", "lavfi",
                "-i", f"sine=frequency={freq}:duration={duration}:sample_rate=44100",
                "-af",
                f"volume=-20dB,afade=t=in:st=0:d=0.05,afade=t=out:st={fade_out_start}:d=0.08",
                "-ac", "1",
                "-y", str(out_path),
            ]
        )
        return TTSUsage(characters=len(text), seconds=duration)


class ElevenLabsTTS:
    """Real ElevenLabs backend."""

    name = "elevenlabs"

    def __init__(self, settings: Settings):
        if not settings.elevenlabs_api_key:
            raise RuntimeError(
                "STORYLOOM_ELEVENLABS_API_KEY required for --tts elevenlabs. Use --tts offline "
                "to run without keys."
            )
        self._key = settings.elevenlabs_api_key
        self._model = settings.elevenlabs_model

    def synthesize(self, *, text: str, voice_id: str, out_path: Path) -> TTSUsage:
        import httpx

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        resp = httpx.post(
            url,
            headers={"xi-api-key": self._key, "accept": "audio/mpeg"},
            json={"text": text, "model_id": self._model},
            timeout=60.0,
        )
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
        return TTSUsage(characters=len(text), seconds=probe_duration_seconds(str(out_path)))


class OpenAITTS:
    """Real OpenAI TTS backend."""

    name = "openai"

    def __init__(self, settings: Settings):
        if not settings.openai_api_key:
            raise RuntimeError(
                "STORYLOOM_OPENAI_API_KEY required for --tts openai. Use --tts offline to run "
                "without keys."
            )
        self._key = settings.openai_api_key
        self._model = settings.openai_tts_model

    def synthesize(self, *, text: str, voice_id: str, out_path: Path) -> TTSUsage:
        import httpx

        resp = httpx.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {self._key}"},
            json={"model": self._model, "voice": voice_id or "alloy", "input": text},
            timeout=60.0,
        )
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
        return TTSUsage(characters=len(text), seconds=probe_duration_seconds(str(out_path)))


def get_tts_provider(settings: Settings | None = None, override: str | None = None) -> TTSProvider:
    settings = settings or get_settings()
    provider = (override or settings.tts_provider).lower()
    if provider == "offline":
        return OfflineTTS()
    if provider == "elevenlabs":
        return ElevenLabsTTS(settings)
    if provider == "openai":
        return OpenAITTS(settings)
    raise ValueError(f"Unknown TTS provider {provider!r} (offline|elevenlabs|openai)")


def is_paid_provider(name: str) -> bool:
    return name.lower() in {"elevenlabs", "openai"}

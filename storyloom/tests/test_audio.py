"""Audio assertions on a real offline render (SPEC §12: measured LUFS + duration tolerance)."""

from __future__ import annotations

from pathlib import Path

from storyloom.audio.ffmpeg import measure_lufs, probe_duration_seconds
from storyloom.config import get_settings
from storyloom.pipeline.context import StageContext
from storyloom.pipeline.runstore import RunStore
from storyloom.pipeline.stages import draft, master, narrate, outline
from storyloom.providers.llm import get_llm_provider
from storyloom.providers.tts import get_tts_provider

from .conftest import requires_ffmpeg


def _ctx(tmp_path: Path, bible) -> StageContext:
    return StageContext(
        store=RunStore(tmp_path / "run"),
        settings=get_settings(),
        llm=get_llm_provider(override="offline"),
        tts=get_tts_provider(override="offline"),
        bible=bible,
        theme="rain",
        target_minutes=7,
    )


@requires_ffmpeg
def test_render_produces_mastered_mp3_at_target_lufs(tmp_path, example_bible) -> None:
    ctx = _ctx(tmp_path, example_bible)
    outline.run(ctx)
    draft.run(ctx)
    narrate.run(ctx)
    info = master.run(ctx)

    mp3 = ctx.store.master_path
    assert mp3.exists() and mp3.stat().st_size > 1000

    # Normalized to -16 LUFS integrated (Apple Podcasts target) within a reasonable tolerance.
    assert info["measured_lufs"] is not None
    assert abs(info["measured_lufs"] - get_settings().target_lufs) <= 2.0

    # Mastered duration tracks the narration it was built from (internal consistency; the spec's
    # "within 20% of target minutes" applies to real TTS renders, not the offline tone backend).
    narration_s = probe_duration_seconds(str(ctx.store.narration_path))
    assert abs(info["duration_s"] - narration_s) <= 1.5


@requires_ffmpeg
def test_narrate_is_idempotent(tmp_path, example_bible) -> None:
    ctx = _ctx(tmp_path, example_bible)
    outline.run(ctx)
    draft.run(ctx)
    narrate.run(ctx)
    first = probe_duration_seconds(str(ctx.store.narration_path))
    seg_count_first = len(list(ctx.store.segments_dir.glob("seg_*.wav")))
    narrate.run(ctx)  # re-run: no duplicate side effects
    second = probe_duration_seconds(str(ctx.store.narration_path))
    seg_count_second = len(list(ctx.store.segments_dir.glob("seg_*.wav")))
    assert seg_count_first == seg_count_second
    assert abs(first - second) < 0.5


@requires_ffmpeg
def test_measure_lufs_on_silence_is_none_or_low(tmp_path) -> None:
    from storyloom.audio.mixer import make_silence

    sil = make_silence(1.0, tmp_path / "s.wav")
    # Silence has undefined loudness; the helper must not crash.
    val = measure_lufs(str(sil))
    assert val is None or val < -30

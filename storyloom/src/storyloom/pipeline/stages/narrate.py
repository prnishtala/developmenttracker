"""Stage 4: narrate (SPEC §6.4).

Parse speaker tags, route each line to the mapped voice, synthesize segments, and concatenate with
natural inter-line pauses (350–600ms; longer at beat boundaries).
"""

from __future__ import annotations

import re

from ...audio.mixer import concat_narration, make_silence
from ..context import StageContext
from ..types import TTSUsage

_SFX_RE = re.compile(r"^\[SFX:\s*(?P<desc>.*?)(?:,\s*(?P<secs>\d+(?:\.\d+)?)\s*s)?\]\s*$", re.I)
_SPEAKER_RE = re.compile(r"^\[(?P<tag>[A-Z0-9_]+)\]\s*(?P<text>.+?)\s*$")

# Inter-line pauses (SPEC §6.4).
_PAUSE_DEFAULT = 0.45
_PAUSE_BOUNDARY = 0.7  # around SFX / beat boundaries
_DEFAULT_NARRATOR_VOICE = "narrator"


def _voice_map(ctx: StageContext) -> dict[str, str]:
    mapping = {"NARRATOR": _DEFAULT_NARRATOR_VOICE}
    for char in ctx.bible.canon_characters:
        mapping[char.id.upper()] = char.voice_id or _DEFAULT_NARRATOR_VOICE
    return mapping


def _parse_lines(script_md: str) -> list[tuple[str, str, float | None]]:
    """Return list of (kind, payload, secs). kind in {speak, sfx}."""
    parsed: list[tuple[str, str, float | None]] = []
    for raw in script_md.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        sfx = _SFX_RE.match(line)
        if sfx:
            secs = float(sfx.group("secs")) if sfx.group("secs") else 2.0
            parsed.append(("sfx", sfx.group("desc"), secs))
            continue
        spk = _SPEAKER_RE.match(line)
        if spk:
            parsed.append(("speak", f"{spk.group('tag')}\t{spk.group('text')}", None))
    return parsed


def run(ctx: StageContext) -> dict:
    if not ctx.store.script_path.exists():
        raise RuntimeError("narrate stage requires a script; run the draft stage first")
    script_md = ctx.store.script_path.read_text(encoding="utf-8")
    vmap = _voice_map(ctx)
    parsed = _parse_lines(script_md)

    segments: list[tuple] = []
    usage = TTSUsage()
    seg_index = 0
    for i, (kind, payload, secs) in enumerate(parsed):
        next_is_sfx = i + 1 < len(parsed) and parsed[i + 1][0] == "sfx"
        if kind == "sfx":
            # TODO(M-later): route to a licensed SFX library. For now a timed soft gap preserves
            # pacing without pulling unlicensed audio (SPEC §6).
            seg_path = ctx.store.segments_dir / f"seg_{seg_index:03d}_sfx.wav"
            make_silence(secs or 2.0, seg_path)
            segments.append((seg_path, _PAUSE_DEFAULT))
        else:
            tag, text = payload.split("\t", 1)
            voice = vmap.get(tag, _DEFAULT_NARRATOR_VOICE)
            seg_path = ctx.store.segments_dir / f"seg_{seg_index:03d}_{tag.lower()}.wav"
            seg_usage = ctx.tts.synthesize(text=text, voice_id=voice, out_path=seg_path)
            usage.characters += seg_usage.characters
            usage.seconds += seg_usage.seconds
            pause = _PAUSE_BOUNDARY if next_is_sfx else _PAUSE_DEFAULT
            segments.append((seg_path, pause))
        seg_index += 1

    if not segments:
        raise RuntimeError("narrate produced no segments — script had no [SPEAKER]/[SFX] lines")

    duration = concat_narration(segments, ctx.store.narration_path, ctx.store.work_dir)

    meta = ctx.store.read_json(ctx.store.meta_path) if ctx.store.meta_path.exists() else {}
    cost = meta.get("cost", {})
    cost["tts"] = usage.model_dump()
    ctx.store.merge_meta(
        {
            "cost": cost,
            "tts_provider": ctx.tts.name,
            "narration_duration_s": round(duration, 2),
            "segment_count": len(segments),
        }
    )
    return {"duration_s": duration, "segments": len(segments)}

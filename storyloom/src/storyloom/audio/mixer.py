"""ffmpeg-based narration assembly and mastering (SPEC §6.4, §6.5).

- `concat_narration`: join per-line segments with natural inter-line pauses.
- `master`: mix a music bed under the narration, apply gentle compression, normalize to
  -16 LUFS integrated / -1 dBTP true peak (Apple Podcasts target), encode mono MP3.

If no licensed music bed is configured, a soft *self-generated* pad is synthesized — never pull
audio from unlicensed sources (SPEC §6).
"""

from __future__ import annotations

from pathlib import Path

from .ffmpeg import measure_lufs, probe_duration_seconds, run_ffmpeg


def make_silence(duration_s: float, out_path: Path) -> Path:
    run_ffmpeg(
        [
            "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=mono:d={max(0.001, duration_s):.3f}",
            "-ac", "1", "-ar", "44100",
            "-c:a", "pcm_s16le",
            "-y", str(out_path),
        ]
    )
    return out_path


def make_music_bed(duration_s: float, out_path: Path) -> Path:
    """Synthesize a soft, licence-safe ambient pad of the given length."""
    d = f"{duration_s + 1.0:.3f}"
    run_ffmpeg(
        [
            "-f", "lavfi", "-i", f"sine=frequency=196:duration={d}:sample_rate=44100",
            "-f", "lavfi", "-i", f"sine=frequency=294:duration={d}:sample_rate=44100",
            "-filter_complex",
            "[0][1]amix=inputs=2:normalize=0,tremolo=f=0.15:d=0.4,lowpass=f=700,volume=-8dB[b]",
            "-map", "[b]", "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le",
            "-y", str(out_path),
        ]
    )
    return out_path


def concat_narration(
    segments: list[tuple[Path, float]],
    out_path: Path,
    workdir: Path,
) -> float:
    """Concatenate (segment, pause_after_seconds) pairs into one WAV. Returns duration seconds.

    Pauses are realized as generated silence files interleaved between segments (SPEC §6.4:
    350–600ms, longer at beat boundaries — the caller decides the exact pause length).
    """
    workdir.mkdir(parents=True, exist_ok=True)
    list_path = workdir / "concat_list.txt"
    lines: list[str] = []
    for i, (seg_path, pause_after) in enumerate(segments):
        lines.append(f"file '{seg_path.resolve()}'")
        if pause_after > 0:
            sil = make_silence(pause_after, workdir / f"_pause_{i:03d}.wav")
            lines.append(f"file '{sil.resolve()}'")
    list_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    run_ffmpeg(
        [
            "-f", "concat", "-safe", "0", "-i", str(list_path),
            "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
            "-y", str(out_path),
        ]
    )
    return probe_duration_seconds(str(out_path))


def master(
    narration_wav: Path,
    out_mp3: Path,
    *,
    music_bed: Path | None,
    workdir: Path,
    target_lufs: float,
    target_true_peak: float,
    mp3_bitrate: str,
    bed_gain_db: float = -28.0,
) -> dict:
    """Mix bed under narration, compress gently, normalize, encode MP3. Returns audio metadata."""
    workdir.mkdir(parents=True, exist_ok=True)
    narration_s = probe_duration_seconds(str(narration_wav))

    bed = music_bed
    if bed is None or not Path(bed).exists():
        bed = make_music_bed(narration_s, workdir / "_bed.wav")

    filter_complex = (
        f"[1:a]volume={bed_gain_db}dB[bed];"
        f"[0:a][bed]amix=inputs=2:duration=first:normalize=0[mix];"
        f"[mix]acompressor=threshold=-18dB:ratio=2:attack=20:release=250[cmp];"
        f"[cmp]loudnorm=I={target_lufs}:TP={target_true_peak}:LRA=11[out]"
    )
    run_ffmpeg(
        [
            "-i", str(narration_wav),
            "-i", str(bed),
            "-filter_complex", filter_complex,
            "-map", "[out]",
            "-ac", "1",
            "-b:a", mp3_bitrate,
            "-y", str(out_mp3),
        ]
    )

    duration_s = probe_duration_seconds(str(out_mp3))
    lufs = measure_lufs(str(out_mp3))
    return {
        "duration_s": round(duration_s, 2),
        "measured_lufs": lufs,
        "target_lufs": target_lufs,
        "target_true_peak": target_true_peak,
        "bitrate": mp3_bitrate,
        "bytes": out_mp3.stat().st_size,
    }

"""Stage 5: master (SPEC §6.5).

ffmpeg: mix music bed at -28 dB under narration, apply gentle compression, normalize to -16 LUFS
integrated / -1 dBTP true peak (Apple Podcasts target), encode MP3. Write duration back.
"""

from __future__ import annotations

from ...audio.mixer import master as run_master
from ..context import StageContext


def run(ctx: StageContext) -> dict:
    if not ctx.store.narration_path.exists():
        raise RuntimeError("master stage requires narration.wav; run the narrate stage first")

    result = run_master(
        ctx.store.narration_path,
        ctx.store.master_path,
        music_bed=ctx.settings.music_bed_path,
        workdir=ctx.store.work_dir,
        target_lufs=ctx.settings.target_lufs,
        target_true_peak=ctx.settings.target_true_peak,
        mp3_bitrate=ctx.settings.mp3_bitrate,
    )
    ctx.store.merge_meta(
        {
            "audio": result,
            "duration_s": result["duration_s"],
            "master_path": str(ctx.store.master_path),
        }
    )
    return result

"""ffmpeg/ffprobe resolution and invocation (SPEC §2: ffmpeg via subprocess).

Resolution order:
1. STORYLOOM_FFMPEG_BIN if set.
2. `ffmpeg` on PATH.
3. The static binary bundled by imageio-ffmpeg (so CI and laptops work with no system install).
"""

from __future__ import annotations

import re
import shutil
import subprocess
from functools import lru_cache

from ..config import get_settings


@lru_cache(maxsize=1)
def resolve_ffmpeg() -> str:
    settings = get_settings()
    if settings.ffmpeg_bin:
        return settings.ffmpeg_bin
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as exc:  # pragma: no cover - only if nothing is installed
        raise RuntimeError(
            "No ffmpeg found. Install ffmpeg, set STORYLOOM_FFMPEG_BIN, or "
            "`pip install imageio-ffmpeg`."
        ) from exc


def run_ffmpeg(args: list[str], *, capture: bool = True) -> subprocess.CompletedProcess:
    """Run ffmpeg with the resolved binary. `args` excludes the binary itself."""
    cmd = [resolve_ffmpeg(), "-hide_banner", "-nostdin", *args]
    proc = subprocess.run(
        cmd,
        capture_output=capture,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed ({proc.returncode}): {' '.join(cmd)}\n{proc.stderr[-2000:]}"
        )
    return proc


def probe_duration_seconds(path: str) -> float:
    """Measure a file's duration by decoding it (avoids needing a separate ffprobe binary)."""
    proc = run_ffmpeg(["-i", path, "-f", "null", "-"])
    matches = re.findall(r"time=(\d+):(\d+):(\d+\.\d+)", proc.stderr)
    if not matches:
        return 0.0
    h, m, s = matches[-1]
    return int(h) * 3600 + int(m) * 60 + float(s)


def measure_lufs(path: str) -> float | None:
    """Integrated loudness (LUFS) via the ebur128 filter. None if it can't be parsed."""
    proc = run_ffmpeg(["-i", path, "-af", "ebur128", "-f", "null", "-"])
    matches = re.findall(r"I:\s*(-?\d+\.?\d*)\s*LUFS", proc.stderr)
    if not matches:
        return None
    return float(matches[-1])

"""Shared test fixtures."""

from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from storyloom.bible.example import EXAMPLE_BIBLE
from storyloom.bible.schema import StoryBible

REPO_ROOT = Path(__file__).resolve().parents[1]


def _ffmpeg_available() -> bool:
    if shutil.which("ffmpeg"):
        return True
    try:
        import imageio_ffmpeg  # noqa: F401

        return True
    except Exception:
        return False


requires_ffmpeg = pytest.mark.skipif(not _ffmpeg_available(), reason="ffmpeg not available")


@pytest.fixture
def example_bible() -> StoryBible:
    return EXAMPLE_BIBLE.model_copy(deep=True)


@pytest.fixture
def golden_dir() -> Path:
    return Path(__file__).parent / "golden"

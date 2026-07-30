"""Shared context passed to every pipeline stage."""

from __future__ import annotations

from dataclasses import dataclass

from ..bible.schema import StoryBible
from ..config import Settings
from ..providers.llm import LLMProvider
from ..providers.tts import TTSProvider
from .runstore import RunStore


@dataclass
class StageContext:
    store: RunStore
    settings: Settings
    llm: LLMProvider
    tts: TTSProvider
    bible: StoryBible
    theme: str
    target_minutes: int
    prompt_version: str = "v1"

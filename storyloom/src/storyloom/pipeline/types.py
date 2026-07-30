"""Structured types exchanged between pipeline stages (SPEC §6, §7).

Every stage output is a validated pydantic model so it can be persisted to the run store as JSON and
re-loaded by `replay-stage`.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from ..bible.schema import BibleDelta

# --- outline -----------------------------------------------------------------


class OutlineBeat(BaseModel):
    n: int
    beat: str  # what happens in this beat
    emotion: str  # the emotional colour of the beat


class Outline(BaseModel):
    """Structured beat sheet (SPEC §6.1): 4–6 beats ending de-escalated and calm."""

    title: str
    logline: str
    beats: list[OutlineBeat] = Field(default_factory=list)
    characters: list[str] = Field(default_factory=list)  # canon character ids appearing
    thread_advanced: str | None = None  # open-thread id this episode advances
    emotional_arc: str = ""
    ends_calm: bool = True


# --- draft -------------------------------------------------------------------


class DraftResult(BaseModel):
    """Constrained-markdown script plus the declared bible delta (SPEC §6.2)."""

    script_md: str
    bible_delta: BibleDelta = Field(default_factory=BibleDelta)


# --- continuity check (SPEC §5) ----------------------------------------------


class Contradiction(BaseModel):
    world_fact: str
    script_span: str
    explanation: str


class ContinuityResult(BaseModel):
    contradictions: list[Contradiction] = Field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.contradictions


# --- safety (SPEC §7) --------------------------------------------------------


class Violation(BaseModel):
    class_: str = Field(alias="class")
    quote_span: list[int] = Field(default_factory=list)
    severity: str = "low"

    model_config = {"populate_by_name": True}


class SafetyVerdict(BaseModel):
    verdict: str  # pass | flag | block
    age_appropriate: bool = True
    violations: list[Violation] = Field(default_factory=list)
    ends_calm: bool = True
    avoid_list_respected: bool = True
    reading_level_ok: bool = True

    @property
    def is_pass(self) -> bool:
        return self.verdict == "pass"


# --- usage / cost accounting (SPEC §10) --------------------------------------


class LLMUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0


class LLMResult(BaseModel):
    data: dict  # validated by the caller against its schema
    usage: LLMUsage = Field(default_factory=LLMUsage)
    model: str = ""


class TTSUsage(BaseModel):
    characters: int = 0
    seconds: float = 0.0

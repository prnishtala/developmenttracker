"""Pydantic models for the Story Bible (SPEC §5).

The bible is the core data structure: every generation reads it and every accepted episode writes a
delta back. It is versioned and append-only — never destructively overwritten — so history can be
replayed. These models validate the JSON shape both on disk (seed) and in the DB (JSONB) later.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

AGE_BANDS = ("1-2", "2-3", "3-4", "4-6", "6-8", "8-10")


class ChildProfile(BaseModel):
    name: str
    age_band: str
    pronouns: str = "she/her"
    vocabulary_ceiling: str
    attention_span_minutes: int = 7

    @field_validator("age_band")
    @classmethod
    def _valid_band(cls, v: str) -> str:
        if v not in AGE_BANDS:
            raise ValueError(f"age_band must be one of {AGE_BANDS}, got {v!r}")
        return v


class CanonCharacter(BaseModel):
    id: str
    name: str
    role: str
    traits: list[str] = Field(default_factory=list)
    speech_style: str = ""
    voice_id: str = "narrator"
    introduced_in: int = 1


class RecurringSetting(BaseModel):
    id: str
    name: str
    description: str = ""


class EpisodeSummary(BaseModel):
    n: int
    title: str
    one_line: str = ""
    new_facts: list[str] = Field(default_factory=list)


class OpenThread(BaseModel):
    id: str
    description: str
    opened_in: int = 1
    resolved_in: int | None = None


class ArcState(BaseModel):
    current_arc: str = ""
    episodes_into_arc: int = 0


class StoryBible(BaseModel):
    """Full bible document. Matches the JSON shape in SPEC §5."""

    child: ChildProfile
    canon_characters: list[CanonCharacter] = Field(default_factory=list)
    world_facts: list[str] = Field(default_factory=list)
    recurring_settings: list[RecurringSetting] = Field(default_factory=list)
    episode_summaries: list[EpisodeSummary] = Field(default_factory=list)
    open_threads: list[OpenThread] = Field(default_factory=list)
    loved_themes: list[str] = Field(default_factory=list)
    # The avoid list is load-bearing (SPEC §5). Toddler fears are specific and a story that trips
    # one at bedtime is worse than no story.
    avoid: list[str] = Field(default_factory=list)
    arc_state: ArcState = Field(default_factory=ArcState)

    def character_by_id(self, char_id: str) -> CanonCharacter | None:
        return next((c for c in self.canon_characters if c.id == char_id), None)

    def next_episode_number(self) -> int:
        if not self.episode_summaries:
            return 1
        return max(s.n for s in self.episode_summaries) + 1


class BibleDelta(BaseModel):
    """What a draft declares it introduced (SPEC §5, §6.2). Applied on publish as a new version."""

    new_characters: list[CanonCharacter] = Field(default_factory=list)
    new_world_facts: list[str] = Field(default_factory=list)
    new_settings: list[RecurringSetting] = Field(default_factory=list)
    new_open_threads: list[OpenThread] = Field(default_factory=list)
    resolved_thread_ids: list[str] = Field(default_factory=list)
    episode_summary: EpisodeSummary | None = None
    arc_state: ArcState | None = None

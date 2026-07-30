"""Story Bible operations: load, apply_delta, validate continuity (SPEC §5, §6).

M1 works against a bible JSON file on disk (no DB). The functions here are pure and side-effect
free (except the file load/save helpers), so M3 can reuse `apply_delta` unchanged against JSONB.
"""

from __future__ import annotations

import json
from pathlib import Path

from .schema import BibleDelta, StoryBible


def load_bible(path: str | Path) -> StoryBible:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return StoryBible.model_validate(data)


def save_bible(bible: StoryBible, path: str | Path) -> None:
    Path(path).write_text(
        json.dumps(bible.model_dump(mode="json"), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def apply_delta(bible: StoryBible, delta: BibleDelta) -> StoryBible:
    """Return a NEW bible with the delta applied. Append-only: never mutates the input.

    This is what `publish` calls to advance the bible to the next version.
    """
    # Deep copy via round-trip so callers' bible is never mutated.
    updated = bible.model_copy(deep=True)

    existing_char_ids = {c.id for c in updated.canon_characters}
    for char in delta.new_characters:
        if char.id not in existing_char_ids:
            updated.canon_characters.append(char)
            existing_char_ids.add(char.id)

    for fact in delta.new_world_facts:
        if fact not in updated.world_facts:
            updated.world_facts.append(fact)

    existing_setting_ids = {s.id for s in updated.recurring_settings}
    for setting in delta.new_settings:
        if setting.id not in existing_setting_ids:
            updated.recurring_settings.append(setting)
            existing_setting_ids.add(setting.id)

    existing_thread_ids = {t.id for t in updated.open_threads}
    for thread in delta.new_open_threads:
        if thread.id not in existing_thread_ids:
            updated.open_threads.append(thread)
            existing_thread_ids.add(thread.id)

    for tid in delta.resolved_thread_ids:
        for thread in updated.open_threads:
            if thread.id == tid and thread.resolved_in is None:
                thread.resolved_in = (
                    delta.episode_summary.n if delta.episode_summary else None
                )

    if delta.episode_summary is not None:
        # Append-only; replace if same episode number is re-published (idempotent).
        updated.episode_summaries = [
            s for s in updated.episode_summaries if s.n != delta.episode_summary.n
        ]
        updated.episode_summaries.append(delta.episode_summary)
        updated.episode_summaries.sort(key=lambda s: s.n)

    if delta.arc_state is not None:
        updated.arc_state = delta.arc_state

    return updated


def open_threads(bible: StoryBible) -> list:
    """Threads not yet resolved — candidates for an episode to advance."""
    return [t for t in bible.open_threads if t.resolved_in is None]


def select_context(bible: StoryBible, *, last_n_summaries: int = 5) -> dict:
    """Selective retrieval for prompt-stuffing (SPEC §13.2).

    Naive bible-stuffing degrades past ~30 episodes. Pass only the child profile, canon characters,
    world facts, open threads, and the last N episode summaries — not the whole history. This is the
    seam M3 will grow into (relevance-ranked retrieval); M1 just truncates summaries.
    """
    return {
        "child": bible.child.model_dump(mode="json"),
        "canon_characters": [c.model_dump(mode="json") for c in bible.canon_characters],
        "world_facts": bible.world_facts,
        "recurring_settings": [s.model_dump(mode="json") for s in bible.recurring_settings],
        "open_threads": [t.model_dump(mode="json") for t in open_threads(bible)],
        "recent_episodes": [
            s.model_dump(mode="json")
            for s in sorted(bible.episode_summaries, key=lambda s: s.n)[-last_n_summaries:]
        ],
        "loved_themes": bible.loved_themes,
        "avoid": bible.avoid,
        "arc_state": bible.arc_state.model_dump(mode="json"),
    }

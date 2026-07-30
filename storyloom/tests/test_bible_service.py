"""Story Bible service tests: append-only delta application + selective context (SPEC §5, §13.2)."""

from __future__ import annotations

from storyloom.bible.schema import (
    BibleDelta,
    CanonCharacter,
    EpisodeSummary,
    StoryBible,
)
from storyloom.bible.service import apply_delta, open_threads, select_context


def test_apply_delta_is_append_only(example_bible: StoryBible) -> None:
    facts_before = list(example_bible.world_facts)
    delta = BibleDelta(
        new_world_facts=["A brand new fact"],
        new_characters=[CanonCharacter(id="bo", name="Bo", role="friend")],
        episode_summary=EpisodeSummary(n=1, title="Ep One", one_line="..."),
    )
    updated = apply_delta(example_bible, delta)

    # Input bible untouched (append-only, never destructive).
    assert example_bible.world_facts == facts_before
    assert example_bible.character_by_id("bo") is None

    # New version has the additions.
    assert "A brand new fact" in updated.world_facts
    assert updated.character_by_id("bo") is not None
    assert updated.next_episode_number() == 2


def test_apply_delta_resolves_thread(example_bible: StoryBible) -> None:
    delta = BibleDelta(
        resolved_thread_ids=["t1"],
        episode_summary=EpisodeSummary(n=2, title="Resolved"),
    )
    updated = apply_delta(example_bible, delta)
    assert open_threads(updated) == []
    assert updated.open_threads[0].resolved_in == 2


def test_apply_delta_idempotent_on_same_summary(example_bible: StoryBible) -> None:
    delta = BibleDelta(episode_summary=EpisodeSummary(n=1, title="One"))
    once = apply_delta(example_bible, delta)
    twice = apply_delta(once, delta)
    assert len([s for s in twice.episode_summaries if s.n == 1]) == 1


def test_select_context_truncates_summaries(example_bible: StoryBible) -> None:
    for i in range(1, 11):
        example_bible.episode_summaries.append(EpisodeSummary(n=i, title=f"E{i}"))
    ctx = select_context(example_bible, last_n_summaries=5)
    assert len(ctx["recent_episodes"]) == 5
    assert [e["n"] for e in ctx["recent_episodes"]] == [6, 7, 8, 9, 10]
    assert "avoid" in ctx and example_bible.avoid == ctx["avoid"]


def test_open_threads_excludes_resolved() -> None:
    bible = StoryBible.model_validate(
        {
            "child": {"name": "X", "age_band": "2-3", "vocabulary_ceiling": "x"},
            "open_threads": [
                {"id": "a", "description": "open", "opened_in": 1},
                {"id": "b", "description": "done", "opened_in": 1, "resolved_in": 2},
            ],
        }
    )
    assert [t.id for t in open_threads(bible)] == ["a"]

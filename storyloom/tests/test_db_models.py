"""DB model metadata tests (SPEC §4). No live DB required — just the ORM mapping."""

from __future__ import annotations

from storyloom.db.models import Base


def test_all_spec_tables_present() -> None:
    expected = {
        "families",
        "children",
        "story_bibles",
        "episodes",
        "generation_jobs",
        "safety_events",
        "feed_tokens",
    }
    assert expected <= set(Base.metadata.tables)


def test_episode_unique_constraint() -> None:
    episodes = Base.metadata.tables["episodes"]
    uniques = {
        tuple(sorted(c.name for c in con.columns))
        for con in episodes.constraints
        if con.__class__.__name__ == "UniqueConstraint"
    }
    assert ("child_id", "number", "season") in uniques

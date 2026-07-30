"""Story Bible schema tests (SPEC §5)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from storyloom.bible.schema import ChildProfile, StoryBible


def test_example_bible_is_valid(example_bible: StoryBible) -> None:
    assert example_bible.child.name == "Ahana"
    assert example_bible.character_by_id("mira") is not None
    assert example_bible.next_episode_number() == 1


def test_age_band_validation_rejects_bad_band() -> None:
    with pytest.raises(ValidationError):
        ChildProfile(
            name="Test",
            age_band="99-100",
            vocabulary_ceiling="x",
        )


def test_next_episode_number_advances_with_summaries(example_bible: StoryBible) -> None:
    from storyloom.bible.schema import EpisodeSummary

    example_bible.episode_summaries.append(EpisodeSummary(n=3, title="Three"))
    assert example_bible.next_episode_number() == 4

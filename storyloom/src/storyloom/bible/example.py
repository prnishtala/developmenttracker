"""The seeded example Story Bible (SPEC §5). Single source of truth for seed/bible.example.json."""

from __future__ import annotations

from .schema import (
    ArcState,
    CanonCharacter,
    ChildProfile,
    OpenThread,
    RecurringSetting,
    StoryBible,
)

EXAMPLE_BIBLE = StoryBible(
    child=ChildProfile(
        name="Ahana",
        age_band="2-3",
        pronouns="she/her",
        vocabulary_ceiling="short sentences, concrete nouns, no abstractions",
        attention_span_minutes=7,
    ),
    canon_characters=[
        CanonCharacter(
            id="mira",
            name="Mira the Mongoose",
            role="guide",
            traits=["curious", "never scared for long"],
            speech_style="short warm sentences, hums when thinking",
            voice_id="warm_low",
            introduced_in=1,
        )
    ],
    world_facts=[
        "The banyan tree at the edge of the village has a small blue door in its trunk",
        "Rain in this world always smells like cardamom",
    ],
    recurring_settings=[
        RecurringSetting(
            id="banyan",
            name="The Banyan Door",
            description="A small blue door in the trunk of the old banyan tree at the village edge",
        )
    ],
    open_threads=[
        OpenThread(
            id="t1",
            description="The door only opens on rainy days — unexplained",
            opened_in=1,
        )
    ],
    loved_themes=["trains", "elephants", "rain", "helping"],
    avoid=["thunder", "separation from parent", "dark enclosed spaces", "loud surprises"],
    arc_state=ArcState(current_arc="finding the rain-keeper", episodes_into_arc=0),
)

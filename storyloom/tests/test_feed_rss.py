"""RSS feed generation tests (SPEC §9)."""

from __future__ import annotations

from datetime import UTC, datetime
from xml.dom import minidom

from storyloom.feed import FeedChannel, FeedItem, build_feed


def _sample() -> FeedChannel:
    return FeedChannel(
        title="Ahana's Stories",
        description="A private bedtime show for Ahana.",
        link="https://storyloom.example/feed/abc.xml",
        image_url="https://storyloom.example/art.png",
        items=[
            FeedItem(
                guid="episode-uuid-1",
                title="The Blue Door",
                description="Ahana finds the blue door.",
                audio_url="https://storyloom.example/media/abc/ep1.mp3",
                length_bytes=827612,
                duration_seconds=420,
                pub_date=datetime(2026, 7, 30, 8, 0, tzinfo=UTC),
            )
        ],
    )


def test_feed_is_well_formed_xml() -> None:
    xml = build_feed(_sample())
    minidom.parseString(xml)  # raises if malformed


def test_feed_has_private_and_itunes_requirements() -> None:
    xml = build_feed(_sample())
    # Critical for a PRIVATE feed: keep it out of directories (SPEC §9).
    assert "<itunes:block>yes</itunes:block>" in xml
    assert "<itunes:explicit>false</itunes:explicit>" in xml
    assert "<itunes:type>episodic</itunes:type>" in xml
    # Stable, non-permalink guid.
    assert '<guid isPermaLink="false">episode-uuid-1</guid>' in xml
    # Enclosure with accurate byte length + mime type.
    assert 'length="827612"' in xml
    assert 'type="audio/mpeg"' in xml
    # Human-readable duration.
    assert "<itunes:duration>7:00</itunes:duration>" in xml
    # RFC 2822 pubDate.
    assert "30 Jul 2026" in xml


def test_child_id_never_in_feed() -> None:
    # URLs use unguessable tokens, never the child_id (SPEC §8).
    xml = build_feed(_sample())
    assert "child_id" not in xml

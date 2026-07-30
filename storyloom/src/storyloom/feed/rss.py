"""RSS 2.0 + iTunes namespace generation (SPEC §9).

Delivery is a private podcast feed, not a player app (SPEC §1.1). The full HTTP surface (token auth,
media serving) is Milestone 4; this module is the pure XML builder, kept dependency-free and unit
tested so the feed shape is correct before the API is wired up.

Required for podcast apps to accept the feed:
- itunes:explicit=false, itunes:type=episodic
- channel artwork (square, 1400–3000px)
- per-item enclosure with accurate byte length + type=audio/mpeg
- itunes:duration, stable guid (isPermaLink=false)
- itunes:block=yes — prevents directory indexing of a PRIVATE feed
- RFC 2822 pubDate
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape


@dataclass
class FeedItem:
    guid: str
    title: str
    description: str
    audio_url: str
    length_bytes: int
    duration_seconds: int
    pub_date: datetime


@dataclass
class FeedChannel:
    title: str
    description: str
    link: str
    image_url: str
    author: str = "StoryLoom"
    language: str = "en-us"
    items: list[FeedItem] = field(default_factory=list)


def _fmt_duration(seconds: int) -> str:
    h, rem = divmod(max(0, int(seconds)), 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


def _rfc2822(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return format_datetime(dt)


def build_feed(channel: FeedChannel) -> str:
    """Render a private podcast RSS 2.0 feed as a string."""
    parts: list[str] = ['<?xml version="1.0" encoding="UTF-8"?>']
    parts.append(
        '<rss version="2.0" '
        'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" '
        'xmlns:content="http://purl.org/rss/1.0/modules/content/">'
    )
    parts.append("<channel>")
    parts.append(f"<title>{escape(channel.title)}</title>")
    parts.append(f"<link>{escape(channel.link)}</link>")
    parts.append(f"<description>{escape(channel.description)}</description>")
    parts.append(f"<language>{escape(channel.language)}</language>")
    parts.append(f"<itunes:author>{escape(channel.author)}</itunes:author>")
    parts.append("<itunes:explicit>false</itunes:explicit>")
    parts.append("<itunes:type>episodic</itunes:type>")
    # Critical for a PRIVATE feed: keep it out of podcast directories.
    parts.append("<itunes:block>yes</itunes:block>")
    parts.append(f'<itunes:image href="{escape(channel.image_url)}"/>')
    parts.append(
        f'<image><url>{escape(channel.image_url)}</url>'
        f"<title>{escape(channel.title)}</title>"
        f"<link>{escape(channel.link)}</link></image>"
    )

    for item in channel.items:
        parts.append("<item>")
        parts.append(f"<title>{escape(item.title)}</title>")
        parts.append(f"<description>{escape(item.description)}</description>")
        parts.append(f'<guid isPermaLink="false">{escape(item.guid)}</guid>')
        parts.append(f"<pubDate>{_rfc2822(item.pub_date)}</pubDate>")
        parts.append(
            f'<enclosure url="{escape(item.audio_url)}" '
            f'length="{int(item.length_bytes)}" type="audio/mpeg"/>'
        )
        parts.append(f"<itunes:duration>{_fmt_duration(item.duration_seconds)}</itunes:duration>")
        parts.append("<itunes:explicit>false</itunes:explicit>")
        parts.append("</item>")

    parts.append("</channel>")
    parts.append("</rss>")
    return "\n".join(parts)

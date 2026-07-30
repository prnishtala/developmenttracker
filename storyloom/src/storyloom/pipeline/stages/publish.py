"""Stage 6: publish (SPEC §6.6).

Full publish — upload to object storage, set `published_at`, invalidate the feed cache, and apply
the `bible_delta` as a new bible VERSION in the DB — is Milestone 4/3 work and needs the DB + MinIO.

In M1 (no DB) this stage does the one piece that is meaningful offline: it applies the declared
`bible_delta` to the in-memory bible and writes a PREVIEW of the next bible version next to the run,
so continuity can be inspected by hand. It never overwrites the seed bible (append-only rule).
"""

from __future__ import annotations

from ...bible.schema import BibleDelta
from ...bible.service import apply_delta
from ..context import StageContext


def run(ctx: StageContext) -> dict:
    if not ctx.store.bible_delta_path.exists():
        raise RuntimeError("publish requires a bible_delta; run the draft stage first")
    delta = BibleDelta.model_validate(ctx.store.read_json(ctx.store.bible_delta_path))
    next_bible = apply_delta(ctx.bible, delta)

    preview_path = ctx.store.root / "bible.next.json"
    ctx.store.write_json(preview_path, next_bible.model_dump(mode="json"))
    ctx.store.merge_meta({"bible_next_preview": str(preview_path)})
    return {
        "world_facts": len(next_bible.world_facts),
        "episode_summaries": len(next_bible.episode_summaries),
        "preview_path": str(preview_path),
    }

"""Stage 2: draft (SPEC §6.2).

Inputs: bible + outline. Output: a constrained-markdown script with explicit speaker tags, plus a
`bible_delta` declaring everything new it introduced (continuity contract, SPEC §5).
"""

from __future__ import annotations

from ...bible.schema import BibleDelta
from ...bible.service import select_context
from ..context import StageContext
from ..promptlib import load_prompt
from ..types import DraftResult, LLMUsage, Outline


def run(ctx: StageContext) -> DraftResult:
    if not ctx.store.outline_path.exists():
        raise RuntimeError("draft stage requires an outline; run the outline stage first")
    outline = Outline.model_validate(ctx.store.read_json(ctx.store.outline_path))

    context = select_context(ctx.bible)
    context["theme"] = ctx.theme
    context["outline"] = outline.model_dump(mode="json")

    system, user = load_prompt("draft", ctx.prompt_version)
    result = ctx.llm.generate_json(
        task="draft",
        system=system,
        user=user,
        context=context,
        max_tokens=4096,
        temperature=0.8,
    )
    draft = DraftResult.model_validate(result.data)

    ctx.store.script_path.write_text(draft.script_md, encoding="utf-8")
    ctx.store.write_json(ctx.store.bible_delta_path, draft.bible_delta.model_dump(mode="json"))
    _record_usage(ctx, result.usage)
    return draft


def load_persisted(ctx: StageContext) -> DraftResult:
    return DraftResult(
        script_md=ctx.store.script_path.read_text(encoding="utf-8"),
        bible_delta=BibleDelta.model_validate(ctx.store.read_json(ctx.store.bible_delta_path)),
    )


def _record_usage(ctx: StageContext, usage: LLMUsage) -> None:
    meta = ctx.store.read_json(ctx.store.meta_path) if ctx.store.meta_path.exists() else {}
    cost = meta.get("cost", {})
    cost["draft"] = usage.model_dump()
    ctx.store.merge_meta({"cost": cost})

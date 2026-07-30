"""Stage 1: outline (SPEC §6.1).

Inputs: bible, requested theme, target duration. Output: a structured beat sheet (4–6 beats), which
canon characters appear, which open thread advances, a single emotional arc ending in calm.
"""

from __future__ import annotations

from ...bible.service import select_context
from ..context import StageContext
from ..promptlib import load_prompt
from ..types import LLMUsage, Outline


def run(ctx: StageContext) -> Outline:
    context = select_context(ctx.bible)
    context["theme"] = ctx.theme
    context["target_minutes"] = ctx.target_minutes

    system, user = load_prompt(
        "outline",
        ctx.prompt_version,
        theme=ctx.theme,
        target_minutes=ctx.target_minutes,
    )
    result = ctx.llm.generate_json(
        task="outline",
        system=system,
        user=user,
        context=context,
        max_tokens=1200,
        temperature=0.8,
    )
    outline = Outline.model_validate(result.data)

    payload = outline.model_dump(mode="json")
    payload["_usage"] = result.usage.model_dump()
    ctx.store.write_json(ctx.store.outline_path, payload)
    _record_usage(ctx, result.usage)
    return outline


def _record_usage(ctx: StageContext, usage: LLMUsage) -> None:
    meta = ctx.store.read_json(ctx.store.meta_path) if ctx.store.meta_path.exists() else {}
    cost = meta.get("cost", {})
    cost["outline"] = usage.model_dump()
    ctx.store.merge_meta({"cost": cost})

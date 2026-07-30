"""Pipeline state machine (SPEC §6).

M1 runs synchronously from the CLI. Each stage is a pure, idempotent function that persists its
output to the run store before advancing, so `replay-stage` can resume from any point. In M4 these
same stage functions become individual arq jobs — the orchestration moves to the queue, the stage
code does not change.

Two gates are enforced here, not in the stages:
  1. Safety fails CLOSED (SPEC §7.5): only a `pass` verdict advances to narrate. A non-pass verdict
     OR any error in the safety stage sends the episode to `held_for_review` and it never renders.
  2. Spend gate (SPEC §15): a *paid* TTS provider does not run without explicit confirmation, so we
     stop and show the script before spending money on synthesis.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from ..providers.tts import is_paid_provider
from .context import StageContext
from .stages import draft, master, narrate, outline, publish, safety
from .types import SafetyVerdict

logger = logging.getLogger("storyloom.runner")

# Episode statuses (SPEC §4).
STATUS_QUEUED = "queued"
STATUS_OUTLINED = "outlined"
STATUS_DRAFTED = "drafted"
STATUS_SAFETY_CHECKED = "safety_checked"
STATUS_HELD = "held_for_review"
STATUS_AWAITING_SPEND = "awaiting_spend_confirmation"
STATUS_NARRATED = "narrated"
STATUS_MASTERED = "mastered"
STATUS_PUBLISHED = "published"
STATUS_FAILED = "failed"

STAGE_FUNCS = {
    "outline": outline.run,
    "draft": draft.run,
    "safety": safety.run,
    "narrate": narrate.run,
    "master": master.run,
    "publish": publish.run,
}


@dataclass
class PipelineResult:
    status: str
    stages_run: list[str] = field(default_factory=list)
    safety: SafetyVerdict | None = None
    message: str = ""


def _set_status(ctx: StageContext, status: str) -> None:
    ctx.store.merge_meta({"status": status})


def generate(ctx: StageContext, *, confirm_spend: bool = False) -> PipelineResult:
    """Run the full pipeline with the safety and spend gates enforced."""
    result = PipelineResult(status=STATUS_QUEUED)
    # Start clean: never present stale audio from a prior run of the same slug. (replay-stage is the
    # tool for surgical single-stage re-runs; a full generate re-renders.)
    for stale in (ctx.store.master_path, ctx.store.narration_path):
        stale.unlink(missing_ok=True)
    _set_status(ctx, STATUS_QUEUED)

    outline.run(ctx)
    result.stages_run.append("outline")
    _set_status(ctx, STATUS_OUTLINED)

    draft.run(ctx)
    result.stages_run.append("draft")
    _set_status(ctx, STATUS_DRAFTED)

    # --- Safety gate: fail CLOSED (SPEC §7.5) --------------------------------
    try:
        verdict = safety.run(ctx)
    except Exception as exc:  # an error is a BLOCK, never a pass
        logger.error("safety stage errored; failing closed to held_for_review: %s", exc)
        _set_status(ctx, STATUS_HELD)
        result.status = STATUS_HELD
        result.message = f"Safety stage error — held for review (fail-closed): {exc}"
        return result
    result.stages_run.append("safety")
    result.safety = verdict
    _set_status(ctx, STATUS_SAFETY_CHECKED)

    if not verdict.is_pass:
        _set_status(ctx, STATUS_HELD)
        result.status = STATUS_HELD
        result.message = f"Safety verdict '{verdict.verdict}' — held for review. Not rendered."
        return result

    # --- Spend gate (SPEC §15) ----------------------------------------------
    if is_paid_provider(ctx.tts.name) and not confirm_spend:
        _set_status(ctx, STATUS_AWAITING_SPEND)
        result.status = STATUS_AWAITING_SPEND
        result.message = (
            f"Script ready. TTS provider '{ctx.tts.name}' costs money. Review "
            f"{ctx.store.script_path} then re-run with --yes to synthesize audio."
        )
        return result

    narrate.run(ctx)
    result.stages_run.append("narrate")
    _set_status(ctx, STATUS_NARRATED)

    master.run(ctx)
    result.stages_run.append("master")
    _set_status(ctx, STATUS_MASTERED)

    # M1 "publish" writes a local next-bible preview (see stages/publish.py).
    publish.run(ctx)
    result.stages_run.append("publish")

    result.status = STATUS_MASTERED
    result.message = f"Episode mastered → {ctx.store.master_path}"
    return result


def replay_stage(ctx: StageContext, stage: str) -> object:
    """Re-run a single stage from persisted inputs (SPEC §6). Idempotent."""
    if stage not in STAGE_FUNCS:
        raise ValueError(f"Unknown stage {stage!r}. Valid: {', '.join(STAGE_FUNCS)}")
    logger.info("replaying stage %s in %s", stage, ctx.store.root)
    return STAGE_FUNCS[stage](ctx)

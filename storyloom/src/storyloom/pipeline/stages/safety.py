"""Stage 3: safety (SPEC §7).

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!! MILESTONE 1 STUB. This stage is a PASS-THROUGH. It does NOT protect a child yet. !!
!! The real five-layer, fail-closed safety pipeline is Milestone 2. Do not ship to a  !!
!! real feed until M2 replaces this. See SPEC §7 and CLAUDE.md.                       !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

The fail-closed control flow already lives in the runner: only a `pass` verdict advances to
narrate; anything else is held for review. This stub always returns `pass` so M1 can render audio,
but it emits a loud warning every time so nobody mistakes it for real protection.
"""

from __future__ import annotations

import logging

from ..context import StageContext
from ..types import SafetyVerdict

logger = logging.getLogger("storyloom.safety")


def run(ctx: StageContext) -> SafetyVerdict:
    logger.warning(
        "SAFETY STAGE IS A MILESTONE-1 STUB (pass-through). No real safety review is running. "
        "Do NOT publish to a child-facing feed until the M2 safety pipeline replaces this."
    )
    verdict = SafetyVerdict(
        verdict="pass",
        age_appropriate=True,
        violations=[],
        ends_calm=True,
        avoid_list_respected=True,
        reading_level_ok=True,
    )
    payload = verdict.model_dump(by_alias=True)
    payload["_stub"] = True
    payload["_todo"] = "Replace with M2 five-layer fail-closed safety pipeline (SPEC §7)."
    ctx.store.write_json(ctx.store.safety_path, payload)
    return verdict

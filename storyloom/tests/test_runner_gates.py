"""Runner gate tests: safety fails CLOSED (SPEC §7.5) and the TTS spend gate (SPEC §15)."""

from __future__ import annotations

from pathlib import Path

import pytest

from storyloom.config import get_settings
from storyloom.pipeline import runner
from storyloom.pipeline.context import StageContext
from storyloom.pipeline.runstore import RunStore
from storyloom.pipeline.stages import safety
from storyloom.pipeline.types import SafetyVerdict
from storyloom.providers.llm import get_llm_provider
from storyloom.providers.tts import get_tts_provider


def _ctx(tmp_path: Path, bible, tts="offline") -> StageContext:
    return StageContext(
        store=RunStore(tmp_path / "run"),
        settings=get_settings(),
        llm=get_llm_provider(override="offline"),
        tts=get_tts_provider(override=tts),
        bible=bible,
        theme="trains",
        target_minutes=7,
    )


def test_offline_full_run_reaches_mastered(tmp_path, example_bible) -> None:
    result = runner.generate(_ctx(tmp_path, example_bible))
    assert result.status == runner.STATUS_MASTERED
    assert "narrate" in result.stages_run and "master" in result.stages_run


def test_non_pass_verdict_holds_for_review(tmp_path, example_bible, monkeypatch) -> None:
    def blocking(ctx):
        return SafetyVerdict(verdict="block", age_appropriate=False)

    monkeypatch.setattr(safety, "run", blocking)
    result = runner.generate(_ctx(tmp_path, example_bible))
    assert result.status == runner.STATUS_HELD
    # Fail closed: audio must NOT have been rendered.
    assert not (tmp_path / "run" / "master.mp3").exists()
    assert "narrate" not in result.stages_run


def test_safety_error_fails_closed(tmp_path, example_bible, monkeypatch) -> None:
    def boom(ctx):
        raise TimeoutError("simulated safety-service timeout")

    monkeypatch.setattr(safety, "run", boom)
    result = runner.generate(_ctx(tmp_path, example_bible))
    # An error is a BLOCK, not a pass (SPEC §7.5).
    assert result.status == runner.STATUS_HELD
    assert not (tmp_path / "run" / "master.mp3").exists()


def test_paid_tts_requires_spend_confirmation(tmp_path, example_bible, monkeypatch) -> None:
    # Provide a fake key so the ElevenLabs provider constructs; it must still not be *used*.
    monkeypatch.setenv("STORYLOOM_ELEVENLABS_API_KEY", "test-key")
    get_settings.cache_clear()
    try:
        ctx = _ctx(tmp_path, example_bible, tts="elevenlabs")
        result = runner.generate(ctx, confirm_spend=False)
        assert result.status == runner.STATUS_AWAITING_SPEND
        assert not ctx.store.master_path.exists()
        # The script was still produced so it can be reviewed before spending.
        assert ctx.store.script_path.exists()
    finally:
        get_settings.cache_clear()


def test_replay_unknown_stage_raises(tmp_path, example_bible) -> None:
    with pytest.raises(ValueError):
        runner.replay_stage(_ctx(tmp_path, example_bible), "nonsense")

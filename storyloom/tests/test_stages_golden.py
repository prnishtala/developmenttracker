"""Golden-file tests on the outline + draft stages (SPEC §12).

The offline backend is deterministic, so its output is frozen here. A template/prompt-plumbing
change that alters output will fail these tests loudly — prompt regressions are silent otherwise.
Structural assertions (beat count, ends_calm, speaker tags, avoid-list respect) guard the spec
contract independently of the exact wording.
"""

from __future__ import annotations

import json
from pathlib import Path

from storyloom.bible.schema import StoryBible
from storyloom.config import get_settings
from storyloom.pipeline.context import StageContext
from storyloom.pipeline.runstore import RunStore
from storyloom.pipeline.stages import draft, outline
from storyloom.pipeline.types import DraftResult, Outline
from storyloom.providers.llm import get_llm_provider
from storyloom.providers.tts import get_tts_provider


def _ctx(tmp_path: Path, bible: StoryBible) -> StageContext:
    return StageContext(
        store=RunStore(tmp_path / "run"),
        settings=get_settings(),
        llm=get_llm_provider(override="offline"),
        tts=get_tts_provider(override="offline"),
        bible=bible,
        theme="trains",
        target_minutes=7,
        prompt_version="v1",
    )


def test_outline_matches_golden(tmp_path, example_bible, golden_dir) -> None:
    result = outline.run(_ctx(tmp_path, example_bible))
    expected = Outline.model_validate(json.loads((golden_dir / "outline_trains.json").read_text()))
    assert result == expected


def test_outline_structure_contract(tmp_path, example_bible) -> None:
    result = outline.run(_ctx(tmp_path, example_bible))
    assert 4 <= len(result.beats) <= 6  # SPEC §6.1
    assert result.ends_calm is True  # bedtime episodes end de-escalated
    assert "mira" in result.characters  # uses an existing canon character
    assert result.thread_advanced == "t1"  # advances the one open thread


def test_draft_matches_golden(tmp_path, example_bible, golden_dir) -> None:
    ctx = _ctx(tmp_path, example_bible)
    outline.run(ctx)
    result = draft.run(ctx)
    expected_md = (golden_dir / "scripts" / "draft_trains.md").read_text()
    expected_delta = json.loads((golden_dir / "bible_delta_trains.json").read_text())
    assert result.script_md == expected_md
    assert result.bible_delta.model_dump(mode="json") == expected_delta


def test_draft_respects_avoid_list_and_has_speaker_tags(tmp_path, example_bible) -> None:
    ctx = _ctx(tmp_path, example_bible)
    outline.run(ctx)
    result: DraftResult = draft.run(ctx)
    lowered = result.script_md.lower()
    for banned in example_bible.avoid:
        assert banned.lower() not in lowered
    assert "[narrator]" in lowered
    assert "[mira]" in lowered
    # Every non-heading, non-blank line is a tagged utterance or SFX cue.
    for line in result.script_md.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        assert s.startswith("["), f"untagged line: {line!r}"

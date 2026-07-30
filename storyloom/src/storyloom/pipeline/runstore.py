"""Filesystem run store for the M1 CLI pipeline.

Each episode run gets a directory under ./out/<slug>/. Every stage persists its output here BEFORE
advancing, so `replay-stage` can re-run from any point without a database (SPEC §6). M3 swaps this
for DB-backed state; the stage functions don't change.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class RunStore:
    root: Path

    def __post_init__(self) -> None:
        self.root = Path(self.root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.segments_dir.mkdir(parents=True, exist_ok=True)
        self.work_dir.mkdir(parents=True, exist_ok=True)

    # --- paths ---------------------------------------------------------------
    @property
    def outline_path(self) -> Path:
        return self.root / "outline.json"

    @property
    def script_path(self) -> Path:
        return self.root / "script.md"

    @property
    def bible_delta_path(self) -> Path:
        return self.root / "bible_delta.json"

    @property
    def safety_path(self) -> Path:
        return self.root / "safety.json"

    @property
    def narration_path(self) -> Path:
        return self.root / "narration.wav"

    @property
    def master_path(self) -> Path:
        return self.root / "master.mp3"

    @property
    def meta_path(self) -> Path:
        return self.root / "meta.json"

    @property
    def segments_dir(self) -> Path:
        return self.root / "segments"

    @property
    def work_dir(self) -> Path:
        return self.root / ".work"

    # --- helpers -------------------------------------------------------------
    def write_json(self, path: Path, data: dict) -> None:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    def read_json(self, path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    def merge_meta(self, patch: dict) -> dict:
        meta = self.read_json(self.meta_path) if self.meta_path.exists() else {}
        meta.update(patch)
        self.write_json(self.meta_path, meta)
        return meta

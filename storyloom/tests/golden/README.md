# Golden fixtures

Frozen pipeline outputs used to catch silent regressions (SPEC §12).

- `outline_trains.json` / `scripts/draft_trains.md` / `bible_delta_trains.json` — the deterministic
  offline backend's output for the seed bible + theme "trains". Regenerate intentionally (and review
  the diff) if you change the offline templates:

  ```bash
  python - <<'PY'
  # see tests/test_stages_golden.py for the exact construction
  PY
  ```

- `adversarial/` — scripts that MUST be blocked by the safety pipeline. Empty of real cases in M1
  because the safety stage is a stub (SPEC §7 is Milestone 2). Per CLAUDE.md, **every real-world
  safety miss gets added here as a regression case** once M2 lands.

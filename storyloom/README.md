# StoryLoom

> Working name — rename before any public artifact.

Serialized, personalized children's audio show. Each child gets an ongoing story world that
accumulates continuity across episodes and scales vocabulary with age, delivered as a private
podcast feed.

This repository currently implements **Milestone 0 (scaffold)** and **Milestone 1 (one good
episode, CLI only)** from [`SPEC.md`](./SPEC.md). See [`CLAUDE.md`](./CLAUDE.md) for the working
rules and milestone status.

## Quick start (no API keys required)

The pipeline ships with an **offline** LLM backend (a deterministic template generator) and an
**offline TTS backend** (tone/noise synthesis sized to each line). This lets the entire pipeline
run end-to-end — outline → draft → safety(stub) → narrate → master — and produce a real, correctly
mastered MP3 without spending a cent or holding any credentials.

```bash
cd storyloom
python -m pip install -e ".[dev]"

# Generate an episode fully offline. Writes ./out/<slug>/master.mp3
storyloom generate-episode --bible seed/bible.example.json --theme "trains"

# Inspect what happened
ls out/*/
cat out/*/script.md
```

The offline audio is intentionally *not* speech — it proves the pipeline mechanics and the
mastering chain (multi-voice routing, pauses, music bed, -16 LUFS normalization, MP3 encode). The
**real quality gate** in the spec ("play it for Ahana, is she engaged?") requires the real
providers below plus a human listen.

## Using real providers

Copy `.env.example` to `.env` and fill in keys, then:

```bash
storyloom generate-episode \
  --bible seed/bible.example.json --theme "trains" \
  --llm anthropic --tts elevenlabs --yes
```

- `--llm anthropic` uses the Anthropic API with structured JSON output.
- `--tts elevenlabs` / `--tts openai` are the two real TTS backends to A/B (spec §1.5).
- Paid TTS **will not run without `--yes`** — per the spec, we stop and show you the script before
  spending money on synthesis.

A/B the two TTS backends on the identical script:

```bash
storyloom compare-tts --run ./out/<slug> --providers elevenlabs,openai
```

## Infrastructure (M0)

`docker compose up -d` starts Postgres 16, Redis, and MinIO. They are **running but unused in M1** —
the pipeline reads a seeded Story Bible JSON from disk and writes outputs to `./out/`. The DB models
and Alembic baseline exist now so Milestone 3 (DB-backed continuity) can build on them.

```bash
docker compose up -d
alembic upgrade head   # applies the baseline schema
```

## Layout

See [`SPEC.md` §3](./SPEC.md) for the target repo structure. This milestone implements the
`bible/`, `pipeline/`, `providers/`, `audio/`, `feed/`, `db/`, and `cli` pieces; `api/` and `web/`
are later milestones.

## Tests

```bash
pytest
```

Includes golden-file tests on the outline/draft stages, Story Bible schema/service tests, input
sanitization tests, and audio assertions (measured LUFS + duration tolerance) against a real
offline render.

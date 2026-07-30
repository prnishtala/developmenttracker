# StoryLoom

Serialized personalized children's audio. Read SPEC.md before changing pipeline or safety code.

## Rules
- Safety pipeline fails CLOSED. Never auto-publish on error, timeout, or non-`pass` verdict.
- Prompts live in src/storyloom/pipeline/prompts/*.md — never inline in Python.
- Every pipeline stage is idempotent and independently retryable.
- Story Bible is append-only and versioned. Never destructively overwrite.
- No child PII beyond first name and age band. No DOB, no photos, no child accounts.
- Provider calls go through the LLMProvider/TTSProvider interfaces only.
- Add every safety miss to tests/golden/adversarial/ as a regression case.

## Current milestone status
- **M0 (Scaffold): done** — docker-compose (postgres/redis/minio), alembic baseline, config, CLI.
- **M1 (One good episode, CLI only): done (mechanically)** — full pipeline outline → draft →
  safety(stub) → narrate → master produces a mastered MP3 in ./out/. Ships an **offline**
  LLM + TTS backend so the whole pipeline runs with no API keys; swap to Anthropic / ElevenLabs /
  OpenAI via `.env`. The *quality* gate in the spec ("play it for Ahana") still requires the real
  providers and a human listen — that is not something code can self-certify.
- Safety stage is a pass-through **stub** with a loud TODO. Real safety pipeline is M2.

## Commands
```
docker compose up -d
alembic upgrade head

# Runs fully offline (no keys) — produces ./out/<slug>/master.mp3
storyloom generate-episode --bible seed/bible.example.json --theme "trains"

# Use real providers (needs keys in .env; paid TTS requires --yes to spend money)
storyloom generate-episode --bible seed/bible.example.json --theme "trains" \
    --llm anthropic --tts elevenlabs --yes

# Re-run a single stage from persisted state
storyloom replay-stage --run ./out/<slug> --stage draft

# A/B two TTS providers on the identical script
storyloom compare-tts --run ./out/<slug> --providers elevenlabs,openai

pytest
```

## Layout notes
- `pipeline/runner.py` — synchronous state machine for M1. arq workers are M4; the stage functions
  are already pure/idempotent so they lift into arq jobs unchanged.
- Stage outputs are persisted to `./out/<slug>/` (a filesystem "run store") so `replay-stage` can
  resume from any point without a DB. DB models + alembic exist now for M3+ but M1 does not need them.

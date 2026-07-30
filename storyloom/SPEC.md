# StoryLoom — Build Specification v1

Serialized, personalized children's audio show. Each child gets an ongoing story world that
accumulates continuity across episodes and scales vocabulary with age. Companion illustrated
books are Phase 2, not v1.

Working name: StoryLoom. Rename before any public artifact.

---

## 0. Product definition

**What it is:** a generation pipeline that produces a nightly ~7-minute audio episode for a
specific child, in a persistent story world with recurring characters, delivered as a private
podcast feed.

**What it is not:** a one-shot story generator. Every competitor in this category generates a
story and stops. The accumulated story world is the product and the switching cost. If the
continuity layer does not work, there is no business here — build it first, not last.

**v1 success criterion:** Ahana asks for the next episode unprompted, and episode 15 correctly
references something established in episode 3.

### Explicit v1 scope boundary

IN:
- Episode generation pipeline (outline → script → safety → narration → master → publish)
- Persistent per-child Story Bible with continuity enforcement
- Safety pipeline with fail-closed behavior and a human review queue
- Private authenticated RSS feed per child
- Minimal parent web UI: theme input, episode list, approve/reject, feed URL

OUT (deferred, do not build):
- Illustrations, picture books, print fulfillment
- Voice cloning
- Native mobile app
- Auth beyond a single hardcoded family, billing, multi-tenant onboarding
- Interactive/conversational features
- Any child-facing UI

---

## 1. Architectural decisions (decided — do not re-litigate in session)

### 1.1 Delivery is a private podcast RSS feed, not a player app

Highest-leverage decision in this spec. Generate a per-child RSS feed at a URL containing an
unguessable token. Parent subscribes in Apple Podcasts, Spotify, Overcast, or any player.

Consequences:
- Zero player development. No app store review. No native audio session handling.
- Works on smart speakers, CarPlay, tablets, car rides, offline download — all free.
- Playback UX is better than anything you would build.
- Standard pattern (Patreon, Supercast) so it is well-understood by users.

Cost: no in-house listening analytics beyond feed/file access logs. Accept this in v1.

### 1.2 Pipeline first, app second

Build a CLI that produces one finished MP3 end-to-end before writing a single API endpoint or
React component. Quality of the generated episode is the entire risk. UI built on top of
mediocre episodes is wasted work.

Hard gate: do not start Milestone 4 until you have listened to five consecutive episodes and
would keep using them.

### 1.3 Postgres from day one

Not SQLite. The Story Bible is JSONB with partial updates, generation jobs need concurrent
workers, and migrating later costs more than starting correctly. Local via docker-compose.

### 1.4 Async job queue, not inline generation

Episode generation is multi-stage, minutes long, and failure-prone at each stage. Redis + `arq`
(async-native, pairs cleanly with FastAPI, far less ceremony than Celery). Each stage is
independently retryable and idempotent.

### 1.5 Provider abstraction for TTS and LLM

Voice quality is the single biggest quality lever and the pricing landscape moves monthly.
Define `TTSProvider` and `LLMProvider` interfaces. Implement two TTS backends at M1 and A/B them
on the same script. Do not hardcode a vendor SDK into pipeline logic.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| DB | Postgres 16 (JSONB for bible, full-text for episode search later) |
| Queue | Redis + arq |
| Object storage | MinIO locally, S3-compatible in prod (audio files) |
| Migrations | Alembic |
| Script generation | Anthropic API, structured JSON output |
| Safety pass | Separate model call, different prompt, structured verdict |
| TTS | Interface + two implementations (see 1.5) |
| Audio post | ffmpeg via subprocess |
| Frontend | React + Vite + Tailwind (parent console only) |
| Local orchestration | docker-compose |
| Tests | pytest, plus golden-file tests on pipeline stages |

---

## 3. Repo structure

```
storyloom/
  docker-compose.yml
  CLAUDE.md
  pyproject.toml
  alembic/
  src/storyloom/
    config.py              # pydantic-settings, all env
    db/
      models.py
      session.py
    bible/
      schema.py            # pydantic models for Story Bible
      service.py           # load, apply_delta, validate continuity
    pipeline/
      stages/
        outline.py
        draft.py
        safety.py
        narrate.py
        master.py
        publish.py
      runner.py            # state machine, retries, idempotency
      prompts/             # versioned .md prompt files, NOT inline strings
    providers/
      llm.py               # LLMProvider protocol + Anthropic impl
      tts.py               # TTSProvider protocol + 2 impls
    audio/
      mixer.py             # ffmpeg wrapper: music bed, normalize, encode
    feed/
      rss.py               # RSS 2.0 + iTunes namespace generation
    api/
      main.py
      routes/
    cli.py                 # typer: generate-episode, replay-stage, seed-bible
  web/                     # Vite app, built later
  tests/
    golden/                # frozen scripts + expected safety verdicts
```

Prompts live in versioned files under `pipeline/prompts/`, never as inline Python strings. You
will iterate on them constantly and need to diff them.

---

## 4. Data model

```sql
CREATE TABLE families (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE NOT NULL,
  plan          text NOT NULL DEFAULT 'free',
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- COPPA minimization: first name only, age BAND not DOB, no photos, no child login.
CREATE TABLE children (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name    text NOT NULL,
  age_band      text NOT NULL CHECK (age_band IN ('1-2','2-3','3-4','4-6','6-8','8-10')),
  pronouns      text NOT NULL DEFAULT 'she/her',
  narrator_voice text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE story_bibles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  version       int  NOT NULL,
  bible         jsonb NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, version)
);

CREATE TABLE episodes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  season        int  NOT NULL DEFAULT 1,
  number        int  NOT NULL,
  title         text,
  status        text NOT NULL DEFAULT 'queued',
  outline       jsonb,
  script_md     text,
  safety_report jsonb,
  bible_delta   jsonb,
  audio_key     text,
  duration_s    int,
  prompt_version text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  UNIQUE (child_id, season, number)
);

CREATE TABLE generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id    uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  stage         text NOT NULL,
  attempts      int  NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safety_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id    uuid REFERENCES episodes(id) ON DELETE CASCADE,
  stage         text NOT NULL,
  verdict       text NOT NULL,       -- pass | flag | block
  detail        jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feed_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,   -- sha256 of the raw token; raw shown once
  revoked_at    timestamptz,
  last_seen_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

Episode status values: `queued`, `outlined`, `drafted`, `safety_checked`, `held_for_review`,
`narrated`, `mastered`, `published`, `failed`.

---

## 5. Story Bible schema

The core data structure. Every generation reads it; every accepted episode writes a delta back.
Versioned and append-only — never destructively overwrite, so you can replay history.

```json
{
  "child": {
    "name": "Ahana",
    "age_band": "2-3",
    "pronouns": "she/her",
    "vocabulary_ceiling": "short sentences, concrete nouns, no abstractions",
    "attention_span_minutes": 7
  },
  "canon_characters": [
    {
      "id": "mira",
      "name": "Mira the Mongoose",
      "role": "guide",
      "traits": ["curious", "never scared for long"],
      "speech_style": "short warm sentences, hums when thinking",
      "voice_id": "warm_low",
      "introduced_in": 1
    }
  ],
  "world_facts": [
    "The banyan tree at the edge of the village has a small blue door in its trunk",
    "Rain in this world always smells like cardamom"
  ],
  "recurring_settings": [
    {"id": "banyan", "name": "The Banyan Door", "description": "..."}
  ],
  "episode_summaries": [
    {"n": 1, "title": "The Blue Door", "one_line": "...", "new_facts": ["..."]}
  ],
  "open_threads": [
    {"id": "t1", "description": "The door only opens on rainy days — unexplained", "opened_in": 1}
  ],
  "loved_themes": ["trains", "elephants", "rain", "helping"],
  "avoid": ["thunder", "separation from parent", "dark enclosed spaces", "loud surprises"],
  "arc_state": {"current_arc": "finding the rain-keeper", "episodes_into_arc": 3}
}
```

The `avoid` list is load-bearing. Toddler fears are specific and a story that trips one at
bedtime is worse than no story. Parent edits this directly in the UI.

**Continuity enforcement:** the draft stage receives the bible and must emit a `bible_delta`
declaring any new characters, facts, or threads it introduced. Validate that the script does not
contradict existing `world_facts` — run a dedicated check call that receives the script plus the
bible and returns contradictions as structured output. Contradiction → regenerate, max 2 retries,
then `held_for_review`.

---

## 6. Generation pipeline

State machine in `pipeline/runner.py`. Each stage is a separate arq job, idempotent, resumable.
Persist stage output before advancing so `replay-stage` can re-run from any point.

1. **outline** — inputs: bible, requested theme, target duration. Output: structured beat sheet
   (4–6 beats), which canon characters appear, which open thread advances, a single emotional
   arc ending in resolution and calm. Bedtime episodes must end de-escalated.
2. **draft** — inputs: bible + outline. Output: script in a constrained markdown format with
   explicit speaker tags for multi-voice narration:
   ```
   [NARRATOR] Ahana pressed her hand against the blue door.
   [MIRA] It only opens when it rains, you know.
   [SFX: soft rain, 3s]
   ```
   Also outputs `bible_delta`.
3. **safety** — see section 7. Fail closed.
4. **narrate** — parse speaker tags, route each line to the mapped voice, synthesize segments,
   concatenate with natural inter-line pauses (350–600ms; longer at beat boundaries).
5. **master** — ffmpeg: mix music bed at -28 dB under narration, apply gentle compression,
   normalize to **-16 LUFS integrated, -1 dBTP true peak** (Apple Podcasts target), encode MP3
   96–128 kbps mono. Write duration back to the row.
6. **publish** — upload to object storage, set `published_at`, invalidate feed cache, apply
   `bible_delta` as a new bible version.

Music: use only licensed or self-generated beds. Do not pull audio from unlicensed sources —
this is a children's brand and a copyright complaint is a fatal early event.

---

## 7. Safety pipeline (non-negotiable)

A single bad episode delivered to a three-year-old is brand-ending. Treat this as core
infrastructure, not a filter bolted on later.

Layers, in order:

1. **Input sanitization** — parent-supplied names and themes are untrusted. Strip prompt-injection
   patterns. Length-cap. Reject non-name-like input in the name field.
2. **Constrained generation** — system prompt defines age band, forbidden content classes,
   required de-escalated ending, vocabulary ceiling.
3. **Independent safety review call** — separate model call, different prompt, receives only the
   finished script. Returns structured verdict:
   ```json
   {
     "verdict": "pass|flag|block",
     "age_appropriate": true,
     "violations": [{"class": "fear", "quote_span": [412, 468], "severity": "medium"}],
     "ends_calm": true,
     "avoid_list_respected": true,
     "reading_level_ok": true
   }
   ```
4. **Deterministic blocklist** — regex pass for hard-forbidden terms. Cheap, catches what models miss.
5. **Fail closed** — anything not returning `pass` goes to `held_for_review` and never reaches the
   feed. No auto-publish on safety-service error or timeout. An error is a block, not a pass.
6. **Review queue** — parent console surfaces held episodes with the flagged span highlighted.

Log every verdict to `safety_events` including passes. When something eventually goes wrong you
need the audit trail.

---

## 8. API surface (v1)

```
POST   /api/children                     create child + initial bible
GET    /api/children/{id}/bible          read
PATCH  /api/children/{id}/bible          edit loved_themes / avoid / characters
POST   /api/children/{id}/episodes       enqueue generation {theme?, target_minutes?}
GET    /api/children/{id}/episodes       list with status
GET    /api/episodes/{id}                detail incl. script + safety report
POST   /api/episodes/{id}/approve        release held_for_review → narrate
POST   /api/episodes/{id}/reject         discard, optional regenerate-with-note
POST   /api/children/{id}/feed-token     mint token, return raw once
DELETE /api/children/{id}                hard delete, cascade, purge audio objects
GET    /feed/{token}.xml                 private RSS (no auth header; token IS the auth)
GET    /media/{token}/{episode_id}.mp3   signed/streamed audio
```

Feed and media routes: constant-time token comparison, rate limit per token, update
`last_seen_at`. Never expose `child_id` in a public URL.

---

## 9. RSS feed requirements

RSS 2.0 with the iTunes namespace. Required for podcast apps to accept it:

- `<itunes:explicit>false</itunes:explicit>`, `<itunes:type>episodic</itunes:type>`
- Channel-level artwork: square, 1400–3000px, JPEG/PNG
- Per-item `<enclosure url length type="audio/mpeg">` with accurate byte length
- `<itunes:duration>`, `<guid isPermaLink="false">` stable per episode
- `<itunes:block>yes</itunes:block>` — critical: prevents directory indexing of a private feed
- Correct RFC 2822 `pubDate`

Test by subscribing via URL in Apple Podcasts and Overcast on your own phone. Both are strict and
fail differently.

---

## 10. Cost model per episode

Populate this table yourself at M1 — I cannot verify current API rates and they change monthly.
Instrument the pipeline to record actual token and character counts per episode from day one.

| Stage | Unit | Est. volume |
|---|---|---|
| Outline | output tokens | ~800 |
| Draft | output tokens | ~3,500 |
| Continuity check | in+out tokens | ~5,000 in / 300 out |
| Safety review | in+out tokens | ~4,000 in / 300 out |
| TTS | characters | ~7,000 for 7 min |
| Storage/egress | MB | ~6 MB/episode |

Target: total COGS under $0.35/episode. At 20 episodes/month that is ~$7/family — which does not
clear a $9.99 subscription. If you land above ~$0.15/episode, the pricing model has to change
(lower episode cadence, or the print upsell carries the margin). Measure this before building UI.

---

## 11. Build order

Each milestone has a hard acceptance test. Do not advance without passing it.

**M0 — Scaffold.** docker-compose (postgres, redis, minio), alembic baseline, config, CLI skeleton.
*Accept:* `docker compose up` then `storyloom --help` works.

**M1 — One good episode, CLI only.** No API, no UI, no DB required beyond a seeded bible JSON on
disk. Full pipeline to a local MP3. Implement two TTS providers and compare on identical script.
*Accept:* you play it for Ahana and she is engaged through the end. **This is the real gate. If
five attempts fail this, stop the project — the rest of the spec is worthless without it.**

**M2 — Safety pipeline.** All five layers, fail-closed, golden tests including deliberately
adversarial scripts that must be blocked.
*Accept:* a hand-written script violating the avoid list is blocked, and the pipeline blocks on a
simulated safety-service timeout.

**M3 — Continuity.** DB-backed bible, delta application, contradiction detection.
*Accept:* generate 5 episodes sequentially; episode 5 references a fact established in episode 2
without being told to, and no episode contradicts an earlier `world_fact`.

**M4 — Feed and API.** FastAPI, arq workers, private RSS, media serving.
*Accept:* subscribe on your phone in Apple Podcasts; new episode appears and downloads.

**M5 — Parent console.** React: bible editor, episode list with status, review queue, feed URL.
*Accept:* generate, review, approve, and listen without touching a terminal.

**M6 — Multi-tenant.** Auth, families beyond your own, billing, per-family rate limits, deletion
endpoint that actually purges objects.
*Accept:* two other families run it for two weeks with no intervention from you.

Phase 2 (do not scope now): illustrated companion book, print fulfillment, generic public podcast
as an acquisition channel.

---

## 12. Testing

- **Golden files:** frozen scripts with expected safety verdicts. Prompt changes must be diffed
  against these before shipping. Prompt regressions are silent otherwise.
- **Stage idempotency:** re-running any stage on the same episode produces no duplicate side effects.
- **Feed validation:** assert generated XML against a podcast feed validator in CI.
- **Adversarial safety suite:** maintain a growing corpus of scripts that must be blocked. Add
  every real-world miss to it.
- **Audio assertions:** measured LUFS within tolerance, duration within 20% of target.

---

## 13. Known hard parts

Ranked by likelihood of sinking the build:

1. **Episode quality at toddler age bands.** Models default to a story voice pitched too old and
   too plot-dense. Expect heavy prompt iteration. This is why M1 gates everything.
2. **Continuity without contradiction.** Naive bible-stuffing degrades as the bible grows past
   ~30 episodes. You will need selective retrieval — pass only relevant characters, threads, and
   the last N summaries, not the whole bible. Design for this at M3.
3. **Multi-voice naturalness.** Concatenated TTS segments sound robotic without careful pause
   tuning and consistent per-character voice mapping.
4. **COGS.** See section 10.
5. **COPPA.** Data minimization is designed in above. Before any non-family user touches this,
   get a real privacy policy and confirm your obligations — I am not able to give a reliable
   compliance read, and this is a category where regulators are active.

---

## 14. CLAUDE.md for the repo

Create this at repo root before the first session:

```markdown
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

## Commands
docker compose up -d
alembic upgrade head
storyloom generate-episode --child <id> --theme "trains"
storyloom replay-stage --episode <id> --stage draft
pytest
```

---

## 15. Kickoff prompt for the first Claude Code session

> Read SPEC.md and CLAUDE.md in full before writing code.
>
> Implement Milestone 0 and Milestone 1 only. Do not build the API, the web UI, or any database
> access beyond reading a seeded Story Bible JSON file from disk.
>
> Deliverables:
> 1. docker-compose with postgres, redis, minio (running but unused in M1)
> 2. Project scaffold per section 3, pyproject with dependencies pinned
> 3. `LLMProvider` and `TTSProvider` protocols with one LLM impl and two TTS impls
> 4. Pipeline stages outline → draft → narrate → master, wired into a `generate-episode` CLI
>    command that writes a finished MP3 to ./out/
> 5. Prompts as separate versioned .md files
> 6. A seeded example Story Bible at ./seed/bible.example.json using the section 5 schema
>
> Skip the safety stage in M1 — stub it as a pass-through with a loud TODO. It is Milestone 2 and
> I want to hear audio quality first.
>
> Ask me for API keys via .env; never hardcode. Stop and show me the generated script before
> spending money on TTS synthesis.

# Ahana Development Tracker — Handoff / Context

A single-family web app to track a toddler ("Ahana," ~19 months): development
activities, nutrition, care, naps, growth, milestones, a local-events finder,
and a meal plan. This doc is a context snapshot for picking the project back up.

## Project basics
- **Repo:** `prnishtala/developmenttracker` · **Working branch:** `claude/day-recap-recording-issues-cnw47v`
- **Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind · **Supabase** (Postgres) · **Vercel** · **OpenAI** (Responses API for text, Whisper for audio) · web-push.
- **Prod:** `developmenttracker.vercel.app` · deploy = merge to `main` → Vercel auto-deploys.

## Critical operational facts
- **Migrations are NOT auto-run.** Paste the SQL from `supabase/migrations/*.sql`
  into the **Supabase SQL editor** manually after each schema change. Vercel does
  not run them.
- **Env vars live in Vercel;** changing them requires a redeploy.
- **No per-user auth** — single shared login (optional, see below). RLS policies
  are open (`for all to anon, authenticated using(true)`).
- Cron endpoints authenticate with `Bearer $CRON_SECRET` and **bypass the login
  gate** in `middleware.ts`.

## Features shipped (all merged to `main`)
| PR | Feature | New tables / migration |
|----|---------|------------------------|
| #1 | Refreshed dev activities (18–24mo: self-dependence, problem-solving, weak-leg motor) + Independence/Problem-Solving dashboard trends | none — `202607080001_toddler_18_24_activity_refresh.sql` (UPDATEs) |
| #3 | **Things To Do** (`/things-to-do`) — DFW toddler events: ingestion (ICS/LLM/AI), daily cron, filters, favorites, Friday digest | `202607200001_things_to_do_events.sql` (`event_sources, events, event_favorites`) |
| #4 | Broader coverage + library storytime cards + fixed source URLs + broader AI prompt | `202607200002_more_dfw_attractions.sql`, `202607200003_library_storytimes_and_more.sql` |
| #5 | In-app **Meal Plan** (`/meal-plan`) + **voice meal logging** (Whisper → AI meal extraction into `nutrition_logs`) | none |
| #6 | Surface real transcription error detail (diagnostic; revealed OpenAI billing issue) | none |
| #7 | Daily **nutrition adherence card** (rule-based, no AI) | none |
| #8 | **Growth & Milestones** (`/growth`): weight/height vs WHO band, milestone checklist by domain, weak-area → activity suggestions, editable child profile | `202607230001_growth_and_milestones.sql` (`child_profile, growth_measurements, milestone_records`) |
| #9 | **Universal voice recap** — one note → meals + naps + care + planned activities | none |
| #10 | **Optional login gate** — env creds, middleware, HMAC cookie, `/login` + Log out | none |
| #11 | **Weekends usable** (7-day activity rotation) + recap **misc → Day notes** card | `202607240001_day_notes.sql` (`day_notes`) |
| #12 | **Voice recap overhaul**: (a) full-length capture — `MediaRecorder` timeslice + 32 kbps + 5-min cap (was truncating at ~30–40 s); (b) vitamin-C fruits (kiwi, etc.) now flip `vitaminC` coverage even when "vitamin C" isn't said; (c) recap now populates **everything** — ad-hoc meals → meal slots, and off-plan play → **ad-hoc development activities** created on the fly (classified into a category + skill tags + duration) that feed dashboard trends, instead of dumping to Day notes; only true leftovers stay in misc | `202607290001_ad_hoc_activities.sql` (`activities.ad_hoc`) |

## Outstanding TODOs (owner actions)
0. Run **`202607290001_ad_hoc_activities.sql`** in Supabase (adds `activities.ad_hoc`).
   Until then, voice-created activities still log fine (the API + reads fail soft),
   but they are **not** excluded from the planned Home rotation and won't show in
   the "Extra activities" card.
1. Run **`202607240001_day_notes.sql`** in Supabase (Day notes card won't persist
   until then; Home still loads — `getDayNote` fails soft).
2. Confirm **`202607230001_growth_and_milestones.sql`** is applied, then open
   `/growth` and **set Ahana's real birth date** (seeded estimate `2024-12-15`
   drives age for growth + milestones).
3. Enable auth: set **`APP_AUTH_PASSWORD`** (optional `APP_AUTH_USERNAME` default
   `admin`, `AUTH_SECRET`) in Vercel → **redeploy**. Inactive until password set.
4. Populate events: trigger `GET /api/discover-events` with
   `Authorization: Bearer $CRON_SECRET` (or wait for the daily cron).
5. **Rotate `CRON_SECRET`** — it was pasted into chat during setup.

## Environment variables (Vercel)
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.4-mini`, optional `OPENAI_TRANSCRIBE_MODEL` (default `whisper-1`)
- Push: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Cron: `CRON_SECRET`, `REMINDER_CRON_SECRET`
- Auth: `APP_AUTH_USERNAME`, `APP_AUTH_PASSWORD`, `AUTH_SECRET`

## Crons (`vercel.json`)
- `/api/push-send` — daily 01:00 UTC (missed-task reminder)
- `/api/discover-events` — daily 08:00 UTC (refresh events; cleanup past; AI-discovery layer)
- `/api/weekend-digest` — Fri 14:00 UTC (weekend events push)

## Code map
- **Data reads:** `lib/data.ts` · **API routes:** `app/api/*/route.ts` · **Pages:** `app/*/page.tsx` · **Components:** `components/*`
- **OpenAI:** raw `fetch` to `/v1/responses` (`lib/nutrition-openai.ts`, `nutrition-voice.ts`, `recap-extract.ts`, `lib/events/*`) and `/v1/audio/transcriptions` (`lib/transcribe.ts`). Everything **degrades gracefully** to manual entry / heuristics on failure.
- **Auth:** `lib/auth.ts` (Web Crypto HMAC), `middleware.ts`, `app/login`, `app/api/login|logout`.
- **Growth ref:** `lib/growth.ts` (WHO girls anchor values — approximate, disclaimed). **Milestones:** `lib/milestones.ts`. **Adherence:** `lib/nutrition-adherence.ts`.

## Known caveats / tuning
- WHO growth bands are approximate anchor values (girls only); boys' band not loaded. Pediatrician's chart is authoritative.
- Curated event scraping is unreliable (library sites 403 bots); breadth comes from the **AI-discovery pass** (unverified, badged) + hand-seeded verified attractions.
- Recap now completes planned activities **and** creates ad-hoc development
  activities for off-plan play (`activities.ad_hoc = true`), so only genuinely
  uncategorized notes go to Day notes. Ad-hoc activities are excluded from the
  planned rotation but feed dashboard skill/language/motor trends via `daily_logs`.
  Extraction quality still depends on the model; the review UI lets the caretaker
  correct before saving.
- Verification in a sandbox = `tsc --noEmit` + `next lint` + Vercel preview build; `next build` needs Supabase env, and the prod domain is not reachable from the assistant's environment.

## Next ideas discussed (not built)
Pediatrician **PDF export** · **weekly report card** · "ask about Ahana" data
assistant · snap-a-plate photo logging · multi-caregiver / handoff view ·
upgrade to real per-user accounts.

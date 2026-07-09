# Family OS

A friction-free Android app that turns the family plan into a **living personal timeline**. Its one
job is to answer *"what should I be doing right now?"* — with the complete runbook for each block one
tap away, so there's no decision to make, just execution.

Built from the Family OS plan (Modules 1–6) and the two per-person daily calendars.

## What it does

- **Now** — a big *"Right now"* card, a *"Next up"* card, then the rest of the day as a terse timeline.
- **Three views** — switch between **Prakash**, **Shraddha**, and **Family** (joint blocks) at the top
  of every screen. Each phone just picks its view; no login in v1.
- **The runbook** — tap any block for the full prescriptive detail: recipes with quantities, the
  Sunday batch-cook execution card as an ordered checklist, meeting agendas, the bedtime/shutdown
  sequences, medication instructions, and each block's "minimum viable" fallback.
- **Optional one-tap done** — never required, no proof, no streak dashboards. Just for your own glance
  and the Family view.
- **Weekly Reset** — the 15-minute Sunday checklist, plus this week's two decisions (who owns the
  Wednesday refresh; which two mornings Prakash takes the 8–9 Ahana block) — which then reassign
  ownership in the timelines. Includes the capture inbox.
- **The manual** — the reference cards in-app: decision trees (nanny sick / child sick / crunch /
  travel), emergency info, screen policy, standing ownership, the 4-week meal grid, home-buying gates,
  the CPA question list, nanny alignment.
- **Bedtime ramp helper** — shows *tonight's* target bedtime for Prakash & Ahana from the ramp start.
- **Optional AI "week ahead" brief** — a single opt-in button; reads the coming week back to you as a
  short brief. Never a planner (that would re-introduce the decisions the OS exists to remove).

## Tech

- **Expo (React Native) + expo-router**, TypeScript. Real installable Android app.
- **Routines are bundled** (`src/data/`) so the app works offline with zero setup.
- **Supabase (optional)** stores only the small mutable state (completions, weekly decisions, capture
  notes, ramps) so both phones and the Family view stay in sync. Without it, everything persists
  locally.
- **OpenAI (optional)** powers the week brief via a Supabase Edge Function — the key stays server-side.

## Run it

```bash
npm install
npm start          # then press "a", or scan the QR with Expo Go on your Android phone
```

The app runs immediately against the bundled plan — no backend required. To try the full loop:
switch **Prakash / Shraddha / Family**, open the **Right now** card, tap a block to read its runbook,
mark one **done**, and open **Reset** to set this week's decisions.

### Build an installable APK

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

## Optional: Supabase sync

1. Create a Supabase project (or reuse the existing one).
2. Run the migration in `supabase/migrations/000_family_os_init.sql` (SQL editor). It creates the
   tables + row-level security and seeds the household with Prakash, Shraddha, and Ahana.
3. Set env for the app (see `.env.example`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## Optional: AI week brief

```bash
supabase functions deploy week-brief
supabase secrets set OPENAI_API_KEY=sk-...   # optional: OPENAI_MODEL
```
Without the key, the brief falls back to a clean rule-based summary.

## Verify the schedule

The recurrence engine + seed are covered by an assertion script (also run in CI):

```bash
npm run seed:build   # snapshot + duplicate-id check
npm run verify       # 32 assertions: rotation, biweekly, monthly/quarterly reviews, owner swaps, ramp
npm run typecheck
npm run lint
```

## Project structure

```
app/                     expo-router screens
  (tabs)/ now · timeline · reset · reference
  routine/[id].tsx       the runbook detail
  settings.tsx
src/
  lib/     recurrence · ramp · schedule · time · categories · store · supabase · notifications · brief
  data/    seed · schedule · dinners · reference   (the bundled Family OS)
  components/
supabase/
  migrations/000_family_os_init.sql
  functions/week-brief/  optional OpenAI Edge Function
scripts/   build-seed · verify · push-seed
assets/ics/              the two source calendars
```

## Not in v1 (deliberately)

- **Proof capture** (photo/audio) — cut to keep it friction-free.
- **Streak / adherence dashboards** — the plan itself rejects daily-percentage tracking as a
  decision-fatigue generator; the real signals stay binary and visible.
- **Google Calendar merge** — planned fast-follow so work meetings appear alongside the plan.

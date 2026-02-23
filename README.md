# Ahana Development Tracker

Mobile-first public tracker for a 14-month-old child's daily development activities and food intake.

## Tech Stack

- Frontend: Next.js (App Router) + React + Tailwind CSS
- Backend: Supabase (PostgreSQL)
- Charts: Recharts
- Deploy target: Vercel

## Features

- No-login, public access flow
- Tap-first nanny workflow (no typing required)
- Daily checklist grouped by activity category
- Activity fields: completion, rating, duration
- Food group tap selectors with `New food` and `Packaged` toggles
- Sugar warning for packaged sugar-related groups
- Auto daily reset by date-based logs
- Daily completion percentage and weekly streak
- Alerts:
  - No outdoor activity for 3 consecutive days
  - No language activity above 15 minutes for 3 consecutive days
- Parent dashboard (`/dashboard`) with:
  - Pie: completed vs missed activities (last 7 days)
  - Bar: minutes by skill tag (last 7 days)
  - Line: language exposure minutes over time (last 14 days)
  - Bar: food diversity count by day (last 14 days)
  - Motor exposure trend line

## Project Structure

```text
app/
  api/
    daily-log/route.ts
    food-log/route.ts
  dashboard/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  ActivityCard.tsx
  DashboardCharts.tsx
  FoodSelector.tsx
  HomeClient.tsx
lib/
  constants.ts
  data.ts
  env.ts
  types.ts
  supabase/
    client.ts
    server.ts
supabase/
  migrations/
    202602230001_init_ahana_tracker.sql
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a new Supabase project.
2. Go to SQL Editor.
3. Run the migration file contents from:
   - `supabase/migrations/202602230001_init_ahana_tracker.sql`

This creates tables, constraints, RLS policies, and seeds the required activities.

## Deployment (Vercel)

1. Push repo to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy.

## Notes

- The app is intentionally public and does not require auth.
- `daily_logs` and `food_logs` use date-based uniqueness to support safe upserts.
- Duration analytics mapping:
  - `0 to 5` = 5
  - `5 to 10` = 10
  - `10 to 20` = 20
  - `20 plus` = 25

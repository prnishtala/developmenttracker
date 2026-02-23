# Ahana Development Tracker

Mobile-first public tracker for a 14-month-old child. Primary workflow is tap/select only for nanny usage.

## Tech Stack

- Frontend: Next.js (App Router) + React + Tailwind CSS
- Backend: Supabase (PostgreSQL)
- Charts: Recharts
- Deploy target: Vercel

## Current Features

- No login required (public link access)
- Home screen split into tabs:
  - Development Activities
  - Food & Nutrition
  - Medicines & Care
  - Nap Times
- Weekday activity planner (Mon-Fri): one activity per category shown each day
- Food & Nutrition tracking:
  - Breakfast / Lunch / Evening snacks
  - Yes/No + quantity (Low, Normal, High)
- Medicines & Care tracking:
  - Iron drops (Yes/No)
  - Multivitamin drops (Yes/No)
  - If medicine given: Vitamin C fruit question + fruit picker
  - Bathing (Yes/No + duration window)
- Nap tracking:
  - Add nap with plus button
  - Start time + either end time or duration
- Home insights:
  - Daily development completion %
  - Weekly streak
  - Alerts for outdoor/language consistency
- Parent dashboard at `/dashboard` with charts

## Project Structure

```text
app/
  api/
    care-log/route.ts
    daily-log/route.ts
    nap-log/route.ts
    nutrition-log/route.ts
  dashboard/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  ActivityCard.tsx
  CareSection.tsx
  DashboardCharts.tsx
  HomeClient.tsx
  NapSection.tsx
  NutritionSection.tsx
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
    202602230002_home_tabs_and_care.sql
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` (or copy `.env.example`) and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create Supabase project.
2. Open SQL Editor.
3. Run these migrations in order:
   - `supabase/migrations/202602230001_init_ahana_tracker.sql`
   - `supabase/migrations/202602230002_home_tabs_and_care.sql`

## Deployment (Vercel)

1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Add env vars in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy.

## Notes

- Duration analytics mapping:
  - `0 to 5` = 5 minutes
  - `5 to 10` = 10 minutes
  - `10 to 20` = 20 minutes
  - `20 plus` = 25 minutes
- Rotate exposed secrets if they were shared in chat/history.

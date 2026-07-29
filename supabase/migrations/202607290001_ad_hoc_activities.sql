-- Ad-hoc (voice-created) development activities.
--
-- The universal voice recap can now invent a development activity on the fly
-- when the caretaker describes something that is not in the day's planned list
-- (e.g. "she went downstairs and played with the balls"). Those get inserted
-- into `activities` with ad_hoc = true so that:
--   * they are EXCLUDED from the Mon–Sun planned-activity rotation on Home, and
--   * they STILL feed the dashboard skill/language/motor trends via daily_logs.
--
-- Run this in the Supabase SQL editor (migrations are not auto-applied).

alter table public.activities
  add column if not exists ad_hoc boolean not null default false;

create index if not exists idx_activities_ad_hoc on public.activities(ad_hoc);

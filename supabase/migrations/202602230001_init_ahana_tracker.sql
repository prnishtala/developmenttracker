create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  skill_tags text[] not null
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  activity_id uuid references public.activities(id) on delete cascade,
  completed boolean default false,
  rating text,
  duration text,
  constraint daily_logs_unique_date_activity unique (date, activity_id),
  constraint daily_logs_rating_check check (rating in ('Bad', 'Ok', 'Good', 'Very Good') or rating is null),
  constraint daily_logs_duration_check check (duration in ('0 to 5', '5 to 10', '10 to 20', '20 plus') or duration is null)
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  food_group text not null,
  new_food boolean default false,
  packaged boolean default false,
  constraint food_logs_unique_date_group unique (date, food_group)
);

create index if not exists idx_daily_logs_date on public.daily_logs(date);
create index if not exists idx_food_logs_date on public.food_logs(date);

alter table public.activities enable row level security;
alter table public.daily_logs enable row level security;
alter table public.food_logs enable row level security;

drop policy if exists activities_public_access on public.activities;
create policy activities_public_access
on public.activities
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists daily_logs_public_access on public.daily_logs;
create policy daily_logs_public_access
on public.daily_logs
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists food_logs_public_access on public.food_logs;
create policy food_logs_public_access
on public.food_logs
for all
to anon, authenticated
using (true)
with check (true);

insert into public.activities (name, category, skill_tags)
values
  ('Push toy walking', 'Movement', array['Gross Motor', 'Balance', 'Coordination']),
  ('Couch cushion climbing', 'Movement', array['Gross Motor', 'Balance', 'Coordination']),
  ('Ball rolling', 'Movement', array['Gross Motor', 'Coordination', 'Attention']),
  ('Outdoor grass walking', 'Movement', array['Gross Motor', 'Balance', 'Sensory Integration']),
  ('Stack blocks', 'Fine Motor', array['Fine Motor', 'Coordination', 'Attention']),
  ('Drop objects in container', 'Fine Motor', array['Fine Motor', 'Coordination', 'Attention']),
  ('Scribble with crayon', 'Fine Motor', array['Fine Motor', 'Coordination', 'Expressive Language']),
  ('Finger food self feeding', 'Fine Motor', array['Fine Motor', 'Independence', 'Coordination']),
  ('Read 2 board books', 'Language', array['Vocabulary', 'Receptive Language', 'Attention']),
  ('Object naming', 'Language', array['Vocabulary', 'Expressive Language', 'Attention']),
  ('Animal sounds', 'Language', array['Expressive Language', 'Vocabulary', 'Emotional Regulation']),
  ('Body part identification', 'Language', array['Receptive Language', 'Vocabulary', 'Attention']),
  ('Simple 1 step instruction game', 'Language', array['Receptive Language', 'Attention', 'Independence']),
  ('Water play', 'Sensory', array['Sensory Integration', 'Attention', 'Emotional Regulation']),
  ('Texture exploration', 'Sensory', array['Sensory Integration', 'Fine Motor', 'Attention']),
  ('Leaf exploration', 'Sensory', array['Sensory Integration', 'Gross Motor', 'Attention']),
  ('Mirror play', 'Social Emotional', array['Emotional Regulation', 'Expressive Language', 'Attention']),
  ('Independent play 10 minutes', 'Social Emotional', array['Independence', 'Attention', 'Emotional Regulation']),
  ('Respond to name practice', 'Social Emotional', array['Receptive Language', 'Attention', 'Emotional Regulation']),
  ('Gentle touch practice', 'Social Emotional', array['Emotional Regulation', 'Fine Motor', 'Expressive Language'])
on conflict do nothing;

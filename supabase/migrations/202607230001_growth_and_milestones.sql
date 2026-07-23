-- Growth tracking + developmental milestones.
-- child_profile holds the birth date / sex used to compute age for both the
-- growth curves and the milestone checklists. growth_measurements stores dated
-- weight/height entries; milestone_records stores per-milestone status.
-- Open RLS, matching the rest of this single-family app.

create extension if not exists pgcrypto;

create table if not exists public.child_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ahana',
  birth_date date,
  sex text not null default 'female',
  singleton boolean not null default true, -- ensures a single active profile row
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_profile_singleton unique (singleton),
  constraint child_profile_sex_check check (sex in ('female', 'male'))
);

create table if not exists public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  measured_on date not null,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 1),
  head_circumference_cm numeric(5, 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_measurements_unique_date unique (measured_on)
);

create index if not exists idx_growth_measured_on on public.growth_measurements(measured_on);

create table if not exists public.milestone_records (
  id uuid primary key default gen_random_uuid(),
  milestone_key text not null,
  status text not null default 'not_yet', -- 'achieved' | 'emerging' | 'not_yet'
  noted_on date,
  notes text,
  updated_at timestamptz not null default now(),
  constraint milestone_records_unique_key unique (milestone_key),
  constraint milestone_records_status_check check (status in ('achieved', 'emerging', 'not_yet'))
);

alter table public.child_profile enable row level security;
alter table public.growth_measurements enable row level security;
alter table public.milestone_records enable row level security;

drop policy if exists child_profile_public_access on public.child_profile;
create policy child_profile_public_access on public.child_profile
for all to anon, authenticated using (true) with check (true);

drop policy if exists growth_measurements_public_access on public.growth_measurements;
create policy growth_measurements_public_access on public.growth_measurements
for all to anon, authenticated using (true) with check (true);

drop policy if exists milestone_records_public_access on public.milestone_records;
create policy milestone_records_public_access on public.milestone_records
for all to anon, authenticated using (true) with check (true);

-- Seed the single profile row. Birth date is an ESTIMATE from "19 months as of
-- July 2026" — correct it in the app once, and the charts/milestones follow.
insert into public.child_profile (name, birth_date, sex, singleton)
values ('Ahana', '2024-12-15', 'female', true)
on conflict (singleton) do nothing;

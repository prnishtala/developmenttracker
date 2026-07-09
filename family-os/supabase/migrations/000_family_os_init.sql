-- Family OS — initial schema.
-- Routines are bundled in the app (src/data/seed.ts); Supabase stores only the
-- small mutable state so both phones and the Family view stay in sync. Every
-- table is scoped to a household via Row Level Security.

create extension if not exists pgcrypto;

-- Households -----------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family OS',
  created_at timestamptz not null default now()
);

-- Profiles: one row per app user, plus Ahana as a non-auth child member -------
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  person_key text not null check (person_key in ('prakash','shraddha','ahana')),
  display_name text not null,
  member_role text not null default 'adult' check (member_role in ('adult','child')),
  created_at timestamptz not null default now(),
  unique (household_id, person_key)
);

-- Optional one-tap completion log (never required) ---------------------------
create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  routine_id text not null,           -- matches Routine.id from the seed
  occurrence_date date not null,      -- local calendar date of the occurrence
  person_key text not null check (person_key in ('prakash','shraddha','ahana','shared')),
  status text not null default 'done' check (status in ('done','skipped')),
  ts timestamptz not null default now(),
  unique (household_id, routine_id, occurrence_date, person_key)
);
create index if not exists completions_lookup
  on completions (household_id, occurrence_date);

-- Weekly Reset decisions ------------------------------------------------------
create table if not exists weekly_decisions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,           -- Monday of the week
  wednesday_refresh_owner text check (wednesday_refresh_owner in ('prakash','shraddha')),
  prakash_morning_days text[] not null default '{}',
  laundry_owner text check (laundry_owner in ('prakash','shraddha')),
  notes text,
  updated_at timestamptz not null default now(),
  unique (household_id, week_start)
);

-- Capture inbox — the mid-day "net", emptied at the Weekly Reset -------------
create table if not exists capture_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_key text not null check (person_key in ('prakash','shraddha')),
  text text not null,
  created_at timestamptz not null default now(),
  cleared_at timestamptz
);

-- Bedtime ramps (editable in Settings) ---------------------------------------
create table if not exists ramps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_key text not null check (person_key in ('prakash','shraddha','ahana')),
  type text not null default 'bedtime',
  start_date date not null,
  start_time text not null,
  target_time text not null,
  step_minutes int not null default 15,
  step_days int not null default 3,
  unique (household_id, person_key, type)
);

-- Row Level Security ---------------------------------------------------------
-- A user can see/write only rows in the household they belong to.
create or replace function current_household_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select household_id from profiles where auth_user_id = auth.uid() limit 1;
$$;

alter table households        enable row level security;
alter table profiles          enable row level security;
alter table completions       enable row level security;
alter table weekly_decisions  enable row level security;
alter table capture_notes     enable row level security;
alter table ramps             enable row level security;

create policy "own household readable" on households
  for select using (id = current_household_id());

create policy "household profiles readable" on profiles
  for select using (household_id = current_household_id());

-- Full read/write within the household for the mutable tables.
do $$
declare t text;
begin
  foreach t in array array['completions','weekly_decisions','capture_notes','ramps']
  loop
    execute format($f$
      create policy "household rw select" on %1$I
        for select using (household_id = current_household_id());
      create policy "household rw insert" on %1$I
        for insert with check (household_id = current_household_id());
      create policy "household rw update" on %1$I
        for update using (household_id = current_household_id())
        with check (household_id = current_household_id());
      create policy "household rw delete" on %1$I
        for delete using (household_id = current_household_id());
    $f$, t);
  end loop;
end $$;

-- Seed one household + the three members. Adults link their auth user on first
-- sign-in (see scripts/README note); Ahana is a child member with no auth user.
insert into households (id, name)
  values ('00000000-0000-0000-0000-0000000000fa', 'Prakash & Shraddha')
  on conflict do nothing;

insert into profiles (household_id, person_key, display_name, member_role)
  values
    ('00000000-0000-0000-0000-0000000000fa', 'prakash', 'Prakash', 'adult'),
    ('00000000-0000-0000-0000-0000000000fa', 'shraddha', 'Shraddha', 'adult'),
    ('00000000-0000-0000-0000-0000000000fa', 'ahana', 'Ahana', 'child')
  on conflict do nothing;

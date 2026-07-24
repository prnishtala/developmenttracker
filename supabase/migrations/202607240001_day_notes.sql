-- Free-text "miscellaneous" notes per day: the catch-all for anything a recap
-- (or the caretaker) mentions that doesn't map to a structured meal/nap/care/
-- activity field, so nothing spoken is lost.

create extension if not exists pgcrypto;

create table if not exists public.day_notes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_notes_unique_date unique (date)
);

create index if not exists idx_day_notes_date on public.day_notes(date);

alter table public.day_notes enable row level security;

drop policy if exists day_notes_public_access on public.day_notes;
create policy day_notes_public_access on public.day_notes
for all to anon, authenticated using (true) with check (true);

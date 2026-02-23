create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null,
  had_meal boolean default false,
  quantity text,
  constraint nutrition_logs_unique_date_meal unique (date, meal_type),
  constraint nutrition_logs_meal_type_check check (meal_type in ('Breakfast', 'Lunch', 'Evening snacks')),
  constraint nutrition_logs_quantity_check check (quantity in ('Low', 'Normal', 'High') or quantity is null)
);

create table if not exists public.care_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  iron_drops boolean default false,
  multivitamin_drops boolean default false,
  vitamin_c_given boolean default false,
  vitamin_c_fruit text,
  bath_completed boolean default false,
  bath_duration text,
  constraint care_logs_bath_duration_check check (bath_duration in ('0 to 5', '5 to 10', '10 to 20', '20 plus') or bath_duration is null)
);

create table if not exists public.nap_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time,
  duration_minutes integer,
  entry_mode text not null default 'end_time',
  constraint nap_logs_unique_date_start unique (date, start_time),
  constraint nap_logs_entry_mode_check check (entry_mode in ('end_time', 'duration')),
  constraint nap_logs_duration_check check (duration_minutes in (15, 30, 45, 60, 75, 90, 120) or duration_minutes is null)
);

create index if not exists idx_nutrition_logs_date on public.nutrition_logs(date);
create index if not exists idx_care_logs_date on public.care_logs(date);
create index if not exists idx_nap_logs_date on public.nap_logs(date);

alter table public.nutrition_logs enable row level security;
alter table public.care_logs enable row level security;
alter table public.nap_logs enable row level security;

drop policy if exists nutrition_logs_public_access on public.nutrition_logs;
create policy nutrition_logs_public_access
on public.nutrition_logs
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists care_logs_public_access on public.care_logs;
create policy care_logs_public_access
on public.care_logs
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists nap_logs_public_access on public.nap_logs;
create policy nap_logs_public_access
on public.nap_logs
for all
to anon, authenticated
using (true)
with check (true);

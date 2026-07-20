-- "Things To Do" — local DFW toddler events discovery.
-- Three tables: event_sources (curated registry the discovery job reads),
-- events (materialized, date-scoped listings), event_favorites (family-shared saves).
-- RLS is enabled with an open policy, matching the rest of this single-family app.

create extension if not exists pgcrypto;

-- Curated registry of trusted DFW sources the daily discovery job pulls from.
create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  url text not null,
  source_type text not null default 'html', -- 'ics' | 'json' | 'html' | 'ai_discovery'
  category_hint text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_sources_unique_url unique (url),
  constraint event_sources_type_check check (source_type in ('ics', 'json', 'html', 'ai_discovery'))
);

-- Individual event listings. Dated events carry event_date; standing attractions
-- (petting farm, train) use event_date = null and are always shown as "ongoing".
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  start_time text,
  end_time text,
  venue_name text,
  city text not null,
  address text,
  is_free boolean not null default true,
  cost_text text,
  setting text not null default 'both', -- 'indoor' | 'outdoor' | 'both'
  category text not null default 'Other',
  min_age_months integer,
  max_age_months integer,
  event_type text not null default 'one_time', -- 'one_time' | 'recurring' | 'attraction'
  source_id uuid references public.event_sources(id) on delete set null,
  source_url text not null,
  booking_url text,
  verified boolean not null default true,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_unique_listing unique (source_url, event_date, title),
  constraint events_setting_check check (setting in ('indoor', 'outdoor', 'both')),
  constraint events_type_check check (event_type in ('one_time', 'recurring', 'attraction'))
);

create index if not exists idx_events_event_date on public.events(event_date);
create index if not exists idx_events_city on public.events(city);
create index if not exists idx_events_verified on public.events(verified);

-- Dedupe ongoing attractions (event_date is null, where the composite unique
-- constraint above treats nulls as distinct). Makes the attraction seed idempotent.
create unique index if not exists uq_events_ongoing_title_city
  on public.events (title, city)
  where event_date is null;

-- Family-shared favorites (no per-user auth in this app; both parents share one list).
create table if not exists public.event_favorites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_favorites_unique_event unique (event_id)
);

alter table public.event_sources enable row level security;
alter table public.events enable row level security;
alter table public.event_favorites enable row level security;

drop policy if exists event_sources_public_access on public.event_sources;
create policy event_sources_public_access
on public.event_sources
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists events_public_access on public.events;
create policy events_public_access
on public.events
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists event_favorites_public_access on public.event_favorites;
create policy event_favorites_public_access
on public.event_favorites
for all
to anon, authenticated
using (true)
with check (true);

-- Seed the curated source registry. The daily discovery job reads these and
-- materializes dated events into public.events for the next 4 weeks.
insert into public.event_sources (name, city, url, source_type, category_hint, notes)
values
  ('Irving Public Library — Storytimes', 'Irving', 'https://cityofirving.libcal.com/calendar/events', 'html', 'Storytime', 'Baby/toddler storytimes; prefers LibCal ICS if available'),
  ('Dallas Public Library — Youth Events', 'Dallas', 'https://dallaslibrary2.org/calendar.php', 'html', 'Storytime', 'Branch storytimes across Dallas'),
  ('Fort Worth Library — Kids Events', 'Fort Worth', 'https://fortworthtexas.libnet.info/events', 'html', 'Storytime', 'Toddler time and family programs'),
  ('Plano Public Library — Storytimes', 'Plano', 'https://plano.bibliocommons.com/v2/events', 'html', 'Storytime', 'Baby and toddler storytimes'),
  ('Frisco Public Library — Youth Events', 'Frisco', 'https://friscolibrary.libnet.info/events', 'html', 'Storytime', 'Little ones storytimes'),
  ('Arlington Public Library — Kids', 'Arlington', 'https://arlington.libnet.info/events', 'html', 'Storytime', 'Storytimes and family programs'),
  ('The Home Depot — Kids Workshops', 'DFW', 'https://www.homedepot.com/workshops/kids', 'html', 'Workshop', 'Free build-it workshops, typically first Saturday monthly'),
  ('Fort Worth Botanic Garden — Family', 'Fort Worth', 'https://fwbg.org/events/', 'html', 'Nature', 'Family and toddler nature programs'),
  ('Dallas Arboretum — Family Events', 'Dallas', 'https://www.dallasarboretum.org/events/', 'html', 'Nature', 'Family festivals and childrens garden events'),
  ('River Legacy Nature Center — Arlington', 'Arlington', 'https://riverlegacy.org/events/', 'html', 'Nature', 'Toddler nature discovery programs'),
  ('Heard Natural Science Museum — McKinney', 'McKinney', 'https://heardmuseum.org/events/', 'html', 'Nature', 'Nature and animal encounters'),
  ('Fort Worth Museum of Science and History', 'Fort Worth', 'https://www.fwmuseum.org/calendar', 'html', 'Museum', 'Early learners programs and free days'),
  ('Perot Museum — Family Programs', 'Dallas', 'https://www.perotmuseum.org/programs-and-events/', 'html', 'Museum', 'Toddler and family programming'),
  ('Grand Prairie Parks and Rec — Youth', 'Grand Prairie', 'https://www.gptx.org/calendar.aspx', 'html', 'Festival', 'City family events and festivals'),
  ('DFW Toddler Events — AI Discovery', 'DFW', 'https://internal/ai-discovery', 'ai_discovery', 'Other', 'Placeholder source row for AI-discovered, unverified events')
on conflict (url) do nothing;

-- Seed a few standing attractions so the tab has trustworthy content before the
-- first discovery run. These are ongoing (event_date null) and never expire.
-- source_id is left null; source_url points to the official page for verification.
insert into public.events (
  title, description, event_date, start_time, end_time, venue_name, city, address,
  is_free, cost_text, setting, category, min_age_months, max_age_months, event_type,
  source_url, verified
)
values
  (
    'Fritz Park Petting Farm',
    'Free seasonal petting farm with goats, sheep, ducks and more. Great for little ones who love animals. Open seasonally (typically summer) — check hours before you go.',
    null, null, null, 'Fritz Park Petting Farm', 'Irving', '312 E Vilbig Rd, Irving, TX 75060',
    true, 'Free', 'outdoor', 'Animals/Farm', 12, 60, 'attraction',
    'https://www.cityofirving.org/1508/Fritz-Park-Petting-Farm', true
  ),
  (
    'Forest Park Miniature Train',
    'A classic outdoor miniature train ride along the Trinity River. Runs weekends (and more in summer). Toddlers ride free on a lap; small ticket for older riders.',
    null, null, null, 'Forest Park Miniature Train', 'Fort Worth', '1600 Colonial Pkwy, Fort Worth, TX 76110',
    false, 'About $3 per rider; lap infants free', 'outdoor', 'Train/Ride', 12, 72, 'attraction',
    'https://www.fwminiaturetrain.com/', true
  ),
  (
    'Fort Worth Botanic Garden',
    'Stroller-friendly gardens with open lawns and a childrens area. A calm outdoor morning for toddlers. Small admission for adults; young children free.',
    null, null, null, 'Fort Worth Botanic Garden', 'Fort Worth', '3220 Botanic Garden Blvd, Fort Worth, TX 76107',
    false, 'Adult admission; young children free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://fwbg.org/', true
  ),
  (
    'Fort Worth Water Gardens',
    'Free, dramatic outdoor water features and open terraces to explore. Hold hands near the water — fun for a short toddler outing downtown.',
    null, null, null, 'Fort Worth Water Gardens', 'Fort Worth', '1502 Commerce St, Fort Worth, TX 76102',
    true, 'Free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://www.fortworthtexas.gov/departments/parks/water-gardens', true
  )
on conflict (title, city) where event_date is null do nothing;

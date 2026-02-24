alter table public.activities
add column if not exists how_to text;

update public.activities set how_to = 'Hold both hands and let baby push a stable toy in a straight path for 3 to 5 minutes.'
where name = 'Push toy walking';

update public.activities set how_to = 'Place two cushions close together and support baby to climb up and down slowly 5 to 8 times.'
where name = 'Couch cushion climbing';

update public.activities set how_to = 'Sit facing baby and roll a soft ball back and forth, encouraging turn-taking for 5 minutes.'
where name = 'Ball rolling';

update public.activities set how_to = 'Let baby walk barefoot on grass with hand support and explore textures for 10 minutes.'
where name = 'Outdoor grass walking';

update public.activities set how_to = 'Show stacking 2 to 4 blocks, then let baby copy while you guide hand placement.'
where name = 'Stack blocks';

update public.activities set how_to = 'Give a container and large safe objects and encourage dropping items in one by one.'
where name = 'Drop objects in container';

update public.activities set how_to = 'Offer a thick crayon and paper and model short strokes while baby imitates.'
where name = 'Scribble with crayon';

update public.activities set how_to = 'Offer soft finger foods and prompt baby to self-feed with minimal help.'
where name = 'Finger food self feeding';

update public.activities set how_to = 'Read two short board books, point to pictures, and pause for baby to respond.'
where name = 'Read 2 board books';

update public.activities set how_to = 'Point to familiar objects and ask "what is this?" then model the word clearly.'
where name = 'Object naming';

update public.activities set how_to = 'Make simple animal sounds and pause for baby to imitate each one.'
where name = 'Animal sounds';

update public.activities set how_to = 'Ask baby to point to body parts like nose, eyes, and ears with praise.'
where name = 'Body part identification';

update public.activities set how_to = 'Give one-step instructions like "give ball" or "clap hands" and reward attempts.'
where name = 'Simple 1 step instruction game';

update public.activities set how_to = 'Use cups and spoons in shallow water and let baby pour and splash safely.'
where name = 'Water play';

update public.activities set how_to = 'Offer safe textures (cloth, sponge, leaf) and let baby touch and compare.'
where name = 'Texture exploration';

update public.activities set how_to = 'Show leaves of different sizes and let baby hold, crinkle, and observe.'
where name = 'Leaf exploration';

update public.activities set how_to = 'Sit with baby in front of a mirror and label actions and expressions.'
where name = 'Mirror play';

update public.activities set how_to = 'Set up safe toys and allow 10 minutes of independent play with supervision.'
where name = 'Independent play 10 minutes';

update public.activities set how_to = 'Call baby’s name from different positions and reward eye contact or turning.'
where name = 'Respond to name practice';

update public.activities set how_to = 'Model gentle touch on doll or caregiver hand and guide baby to copy softly.'
where name = 'Gentle touch practice';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time bigint,
  timezone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_active on public.push_subscriptions(active);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  event_date date,
  request_ip text,
  user_agent text,
  payload jsonb
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_event_date on public.audit_logs(event_date);

alter table public.push_subscriptions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists push_subscriptions_public_access on public.push_subscriptions;
create policy push_subscriptions_public_access
on public.push_subscriptions
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists audit_logs_public_access on public.audit_logs;
create policy audit_logs_public_access
on public.audit_logs
for all
to anon, authenticated
using (true)
with check (true);

-- Enrich "Things To Do": add real library storytime program cards (prioritizing
-- Dallas + Irving, where the family holds memberships), correct the library
-- source URLs to the actual calendar systems, and broaden category/city variety.

-- Fix the two library source URLs that were guessed wrong in the first seed.
update public.event_sources
set url = 'https://irvinglibrary.libcal.com/calendar', source_type = 'html', updated_at = now()
where name = 'Irving Public Library — Storytimes';

update public.event_sources
set url = 'https://dallaslibrary.librarymarket.com/events/upcoming', source_type = 'html', updated_at = now()
where name = 'Dallas Public Library — Youth Events';

-- Verified, recurring library storytime program cards. These are ongoing weekly
-- programs (event_date null); the card links out to the official calendar for
-- current days and times rather than pinning a specific (perishable) slot.
insert into public.events (
  title, description, event_date, start_time, end_time, venue_name, city, address,
  is_free, cost_text, setting, category, min_age_months, max_age_months, event_type,
  source_url, verified
)
values
  (
    'Dallas Public Library — Baby & Toddler Storytimes',
    'Free weekly storytimes for babies and toddlers across Dallas Public Library branches — songs, rhymes, and books. Tap for current branches, days, and times.',
    null, null, null, 'Dallas Public Library (all branches)', 'Dallas', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://dallaslibrary.librarymarket.com/events/upcoming', true
  ),
  (
    'Irving Public Library — Baby & Toddler Storytimes',
    'Free weekly baby and toddler storytimes across Irving Public Library locations (South Irving, West Irving, East branch). Tap for current days and times.',
    null, null, null, 'Irving Public Library', 'Irving', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://irvinglibrary.libcal.com/calendar', true
  ),
  (
    'Fort Worth Library — Toddler Time & Family Storytimes',
    'Free weekly storytimes and toddler time across Fort Worth Library branches. Tap for current branches, days, and times.',
    null, null, null, 'Fort Worth Public Library', 'Fort Worth', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://fortworthtexas.libnet.info/events', true
  ),
  (
    'Plano Public Library — Baby & Toddler Storytimes',
    'Free weekly baby and toddler storytimes across Plano Public Library branches. Tap for current days and times.',
    null, null, null, 'Plano Public Library', 'Plano', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://plano.bibliocommons.com/v2/events', true
  ),
  (
    'Frisco Public Library — Little Ones Storytimes',
    'Free weekly storytimes for little ones at Frisco Public Library. Tap for current days and times.',
    null, null, null, 'Frisco Public Library', 'Frisco', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://friscolibrary.libnet.info/events', true
  ),
  (
    'Arlington Public Library — Storytimes',
    'Free weekly storytimes and family programs across Arlington Public Library branches. Tap for current days and times.',
    null, null, null, 'Arlington Public Library', 'Arlington', null,
    true, 'Free', 'indoor', 'Storytime', 3, 48, 'recurring',
    'https://arlington.libnet.info/events', true
  ),
  -- More category variety (zoos, aquarium, museum, train) across additional cities.
  (
    'Dallas Zoo',
    'Large zoo with a childrens area and easy stroller paths. Toddlers love the animals. Paid admission; check for toddler pricing and cooler morning hours in summer.',
    null, null, null, 'Dallas Zoo', 'Dallas', '650 S R L Thornton Fwy, Dallas, TX 75203',
    false, 'Paid admission', 'outdoor', 'Animals/Farm', 12, 72, 'attraction',
    'https://www.dallaszoo.com/', true
  ),
  (
    'Fort Worth Zoo',
    'Top-rated zoo with shaded paths, a petting area, and a play zone. Great toddler outing. Paid admission; go early in summer heat.',
    null, null, null, 'Fort Worth Zoo', 'Fort Worth', '1989 Colonial Pkwy, Fort Worth, TX 76110',
    false, 'Paid admission', 'outdoor', 'Animals/Farm', 12, 72, 'attraction',
    'https://www.fortworthzoo.org/', true
  ),
  (
    'Perot Museum of Nature and Science',
    'Indoor science museum with a dedicated toddler/early-learner play area — a great rainy or hot-day option. Paid admission.',
    null, null, null, 'Perot Museum of Nature and Science', 'Dallas', '2201 N Field St, Dallas, TX 75201',
    false, 'Paid admission', 'indoor', 'Museum', 12, 72, 'attraction',
    'https://www.perotmuseum.org/', true
  ),
  (
    'SEA LIFE Grapevine Aquarium',
    'Indoor aquarium with a walk-through tunnel and touch pools — an easy air-conditioned outing for little ones. Paid admission.',
    null, null, null, 'SEA LIFE Grapevine Aquarium', 'Grapevine', '3000 Grapevine Mills Pkwy, Grapevine, TX 76051',
    false, 'Paid admission', 'indoor', 'Animals/Farm', 12, 72, 'attraction',
    'https://www.visitsealife.com/grapevine/', true
  ),
  (
    'LEGOLAND Discovery Center',
    'Indoor LEGO play center with soft-play and rides suited to younger children. Air-conditioned rainy/hot-day option. Paid admission.',
    null, null, null, 'LEGOLAND Discovery Center', 'Grapevine', '3000 Grapevine Mills Pkwy, Grapevine, TX 76051',
    false, 'Paid admission', 'indoor', 'Museum', 24, 72, 'attraction',
    'https://www.legolanddiscoverycenter.com/dallas-fort-worth/', true
  ),
  (
    'Grapevine Vintage Railroad',
    'A vintage train ride departing historic downtown Grapevine. A fun outing for train-loving toddlers. Paid tickets; check the schedule.',
    null, null, null, 'Grapevine Vintage Railroad', 'Grapevine', '705 S Main St, Grapevine, TX 76051',
    false, 'Paid tickets', 'outdoor', 'Train/Ride', 12, 72, 'attraction',
    'https://www.grapevinetexasusa.com/grapevine-vintage-railroad/', true
  )
on conflict (title, city) where event_date is null do nothing;

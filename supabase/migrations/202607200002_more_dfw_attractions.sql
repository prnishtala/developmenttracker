-- Broaden immediate "Things To Do" coverage across more DFW cities so the tab
-- has trustworthy, cross-metroplex content before the discovery cron runs.
-- All are ongoing standing attractions (event_date null), free-first.

insert into public.events (
  title, description, event_date, start_time, end_time, venue_name, city, address,
  is_free, cost_text, setting, category, min_age_months, max_age_months, event_type,
  source_url, verified
)
values
  (
    'Klyde Warren Park',
    'Free deck park downtown with a dedicated children''s park, splash fountain, lawns and food trucks. Frequent free family programming — check the calendar.',
    null, null, null, 'Klyde Warren Park', 'Dallas', '2012 Woodall Rodgers Fwy, Dallas, TX 75201',
    true, 'Free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://www.klydewarrenpark.org/', true
  ),
  (
    'Dallas Farmers Market',
    'Free to wander open-air and indoor market. Colorful stalls, music, and space to walk — an easy toddler outing. Some vendors sell snacks.',
    null, null, null, 'Dallas Farmers Market', 'Dallas', '920 S Harwood St, Dallas, TX 75201',
    true, 'Free entry', 'both', 'Festival', 12, 72, 'attraction',
    'https://dallasfarmersmarket.org/', true
  ),
  (
    'Arbor Hills Nature Preserve',
    'Free nature preserve with paved, stroller-friendly trails and a lookout tower. Great for a calm outdoor morning with a toddler.',
    null, null, null, 'Arbor Hills Nature Preserve', 'Plano', '6701 W Parker Rd, Plano, TX 75093',
    true, 'Free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://www.plano.gov/302/Arbor-Hills-Nature-Preserve', true
  ),
  (
    'River Legacy Parks',
    'Free riverside city park with shaded, paved trails, playgrounds and open space. Adjoins the nature center. Easy stroller walking.',
    null, null, null, 'River Legacy Parks', 'Arlington', '701 NW Green Oaks Blvd, Arlington, TX 76006',
    true, 'Free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://riverlegacy.org/', true
  ),
  (
    'Traders Village',
    'Free-entry weekend outdoor marketplace with a small kids'' ride area and lots to look at. Walking is free; rides and snacks are extra.',
    null, null, null, 'Traders Village', 'Grand Prairie', '2602 Mayfield Rd, Grand Prairie, TX 75052',
    true, 'Free entry; rides extra', 'outdoor', 'Festival', 12, 72, 'attraction',
    'https://tradersvillage.com/grand-prairie/', true
  ),
  (
    'Frisco Commons Park',
    'Large city park with playgrounds, open lawns and a pond loop. A relaxed, free outdoor stop in Frisco for little ones.',
    null, null, null, 'Frisco Commons Park', 'Frisco', null,
    true, 'Free', 'outdoor', 'Nature', 12, 72, 'attraction',
    'https://www.friscotexas.gov/facilities', true
  ),
  (
    'Heard Natural Science Museum & Wildlife Sanctuary',
    'Nature museum and sanctuary with animal encounters and stroller-friendly trails. Small admission; young toddlers often free — confirm ages.',
    null, null, null, 'Heard Natural Science Museum', 'McKinney', '1 Nature Pl, McKinney, TX 75069',
    false, 'Admission; check toddler pricing', 'both', 'Animals/Farm', 12, 72, 'attraction',
    'https://heardmuseum.org/', true
  )
on conflict (title, city) where event_date is null do nothing;

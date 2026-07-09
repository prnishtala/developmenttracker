/* Optional: load the bundled seed's routines into a `routines` table in Supabase
 * so they can be queried/cross-referenced server-side (e.g. by future automations).
 * The app itself does NOT need this — it reads the bundled seed directly.
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env.
 * Run with: npm run seed:push
 *
 * Note: this expects an optional `routines` table (not created by migration 000,
 * which intentionally keeps routines client-side). Create it first if you want
 * server-side copies; otherwise skip this script entirely. */
import { createClient } from '@supabase/supabase-js';
import { ROUTINES } from '@/data/seed';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to push the seed.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const rows = ROUTINES.map((r) => ({
    id: r.id,
    source_uid: r.sourceUid ?? null,
    owner: r.owner,
    category: r.category,
    title: r.title,
    terse_line: r.terseLine,
    start_local: r.startLocal || null,
    end_local: r.endLocal || null,
    timezone: r.timezone,
    rrule: r.rrule || null,
    anchor_date: r.anchorDate,
    week_index: r.weekIndex ?? null,
    notify: r.notify ?? null,
    swap: r.swap ?? null,
    no_phone: r.noPhone ?? false,
    marker: r.marker ?? false,
    runbook: r.runbook
  }));

  const { error } = await supabase.from('routines').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Push failed:', error.message);
    process.exit(1);
  }
  console.log(`Pushed ${rows.length} routines to Supabase.`);
}

main();

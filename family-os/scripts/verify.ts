/* Verifies the seed + recurrence engine produce a faithful schedule.
 * Run with: npm run verify   (tsx scripts/verify.ts)
 * Exits non-zero on the first failed assertion so CI catches regressions. */
import { ROUTINES, SCHEDULED_ROUTINES, DEFAULT_RAMPS } from '@/data/seed';
import { expandOccurrences, occurrencesForDate, effectiveOwner } from '@/lib/recurrence';
import { targetBedtimeFor } from '@/lib/ramp';
import { isInView, ownersForView } from '@/lib/categories';
import { WeeklyDecision } from '@/lib/types';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\nFamily OS — schedule verification\n');

// --- Unique ids -------------------------------------------------------------
const ids = ROUTINES.map((r) => r.id);
check('routine ids are unique', new Set(ids).size === ids.length,
  `${ids.length - new Set(ids).size} duplicate(s)`);

// --- Every scheduled routine has a parseable, non-empty RRULE + valid times --
let badTimes = 0;
for (const r of SCHEDULED_ROUTINES) {
  if (!r.marker) {
    if (!/^\d{2}:\d{2}$/.test(r.startLocal) || !/^\d{2}:\d{2}$/.test(r.endLocal)) badTimes++;
  }
  if (!r.rrule) badTimes++;
}
check('all scheduled routines have RRULE + HH:mm times', badTimes === 0, `${badTimes} bad`);

// --- 4-week dinner rotation fires on the right weeks ------------------------
function fires(id: string, dateISO: string): boolean {
  return occurrencesForDate(ROUTINES, dateISO).some((o) => o.routine.id === id);
}
check('Week-1 Monday dinner fires 2026-07-06', fires('dinner-mo-w1', '2026-07-06'));
check('Week-2 Monday dinner fires 2026-07-13', fires('dinner-mo-w2', '2026-07-13'));
check('Week-2 Monday dinner does NOT fire 2026-07-06', !fires('dinner-mo-w2', '2026-07-06'));
check('Week-1 Monday dinner does NOT fire 2026-07-13', !fires('dinner-mo-w1', '2026-07-13'));
check('Week-3 Monday dinner fires 2026-07-20', fires('dinner-mo-w3', '2026-07-20'));
check('Week-4 Monday dinner fires 2026-07-27', fires('dinner-mo-w4', '2026-07-27'));
check('rotation repeats: Week-1 Monday fires again 2026-08-03', fires('dinner-mo-w1', '2026-08-03'));

// --- Biweekly Costco --------------------------------------------------------
check('Costco fires 2026-07-12', fires('costco', '2026-07-12'));
check('Costco skips 2026-07-19', !fires('costco', '2026-07-19'));
check('Costco fires 2026-07-26', fires('costco', '2026-07-26'));

// --- Monthly / quarterly reviews on the right Saturdays ---------------------
check('Money review on 1st Saturday (2026-08-01)', fires('review-money-monthly', '2026-08-01'));
check('Money review NOT on 2026-08-08', !fires('review-money-monthly', '2026-08-08'));
check('Quarterly on 2nd Saturday of July (2026-07-11)', fires('review-quarterly', '2026-07-11'));
check('Quarterly does NOT fire in August (not Apr/Jul/Oct)', !fires('review-quarterly', '2026-08-08'));
check('Learning share on 3rd Saturday (2026-07-18)', fires('review-learning-share', '2026-07-18'));

// --- Weekday vs daily -------------------------------------------------------
check('WFH block fires on a weekday (2026-07-06 Mon)', fires('pk-wfh', '2026-07-06'));
check('WFH block does NOT fire on Saturday (2026-07-11)', !fires('pk-wfh', '2026-07-11'));
check('Evening walk fires every day incl. Sunday (2026-07-12)', fires('fam-walk', '2026-07-12'));

// --- Owner swap via a Weekly Reset decision ---------------------------------
const decisions: WeeklyDecision[] = [
  { weekStart: '2026-07-06', wednesdayRefreshOwner: 'shraddha', prakashMorningDays: ['TU', 'TH'] }
];
const wed = ROUTINES.find((r) => r.id === 'wed-batch-w1')!;
check('Wed batch default owner is shared', wed.owner === 'shared');
check('Wed batch owner becomes shraddha with decision',
  effectiveOwner(wed, '2026-07-08', decisions) === 'shraddha');
const morn = ROUTINES.find((r) => r.id === 'sh-ahana-morning')!;
check('Ahana-morning is Prakash on a chosen morning (Tue)',
  effectiveOwner(morn, '2026-07-07', decisions) === 'prakash');
check('Ahana-morning stays Shraddha on a non-chosen morning (Mon)',
  effectiveOwner(morn, '2026-07-06', decisions) === 'shraddha');

// --- Views ------------------------------------------------------------------
check('Prakash view = prakash + shared', ownersForView('prakash').join() === 'prakash,shared');
check('Family view = shared + ahana', ownersForView('family').join() === 'shared,ahana');
check('shared block shows in Prakash view', isInView('shared', 'prakash'));
check('ahana block shows in Family view but not Prakash view',
  isInView('ahana', 'family') && !isInView('ahana', 'prakash'));

// --- Ramp helper ------------------------------------------------------------
const pkRamp = DEFAULT_RAMPS.find((r) => r.personKey === 'prakash')!;
check('Ramp target on day 0 equals start time (02:00)',
  targetBedtimeFor(pkRamp, '2026-07-06') === '02:00');
check('Ramp shifts 15 min earlier after 3 nights (01:45)',
  targetBedtimeFor(pkRamp, '2026-07-09') === '01:45');
check('Ramp clamps at the target and never overshoots (23:30)',
  targetBedtimeFor(pkRamp, '2026-12-31') === '23:30');

// --- Full-window expansion sanity ------------------------------------------
const occ = expandOccurrences(ROUTINES, '2026-07-06', '2026-07-19', decisions);
check('14-day window produces a healthy number of occurrences (>200)',
  occ.length > 200, `${occ.length}`);

// --- Summary ----------------------------------------------------------------
const byOwner: Record<string, number> = {};
const byCat: Record<string, number> = {};
for (const r of ROUTINES) {
  byOwner[r.owner] = (byOwner[r.owner] || 0) + 1;
  byCat[r.category] = (byCat[r.category] || 0) + 1;
}
console.log('\nSeed summary:');
console.log(`  total routines: ${ROUTINES.length} (scheduled ${SCHEDULED_ROUTINES.length}, reference ${ROUTINES.length - SCHEDULED_ROUTINES.length})`);
console.log('  by owner:', JSON.stringify(byOwner));
console.log('  by category:', JSON.stringify(byCat));

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED\n`);
  process.exit(1);
}
console.log('\nAll checks passed.\n');

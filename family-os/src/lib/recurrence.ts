import { RRule } from 'rrule';
import { Occurrence, PersonKey, Routine, WeeklyDecision } from './types';
import { toMinutes, weekStart, weekdayCode } from './time';

/**
 * Expand a routine's RRULE into local calendar dates.
 *
 * The whole family lives in one timezone, and the app only ever shows blocks in
 * that local wall-clock time. So we expand in "floating local" mode: the RRULE's
 * DTSTART is treated as a naive UTC instant and occurrences are read back with
 * UTC getters. This yields the correct local calendar date on every day of the
 * year, including across DST transitions, without any offset math.
 */
function localDates(routine: Routine, fromISO: string, toISO: string): string[] {
  const [ay, am, ad] = routine.anchorDate.split('-').map((n) => parseInt(n, 10));
  const [sh, sm] = (routine.startLocal || '00:00').split(':').map((n) => parseInt(n, 10));
  const dtstart = new Date(Date.UTC(ay, am - 1, ad, sh, sm || 0));

  const options = RRule.parseString(routine.rrule);
  options.dtstart = dtstart;
  const rule = new RRule(options);

  const [fy, fm, fd] = fromISO.split('-').map((n) => parseInt(n, 10));
  const [ty, tm, td] = toISO.split('-').map((n) => parseInt(n, 10));
  const after = new Date(Date.UTC(fy, fm - 1, fd, 0, 0));
  const before = new Date(Date.UTC(ty, tm - 1, td, 23, 59));

  return rule.between(after, before, true).map((d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

/** The owner of a block after applying this week's Weekly Reset swap decision. */
export function effectiveOwner(
  routine: Routine,
  dateISO: string,
  decisions: WeeklyDecision[]
): PersonKey {
  if (!routine.swap) return routine.owner;
  const wk = weekStart(dateISO);
  const decision = decisions.find((d) => d.weekStart === wk);
  if (!decision) return routine.owner;

  if (routine.swap === 'wednesday_refresh' && decision.wednesdayRefreshOwner) {
    return decision.wednesdayRefreshOwner;
  }
  if (routine.swap === 'laundry' && decision.laundryOwner) {
    return decision.laundryOwner;
  }
  if (routine.swap === 'morning_ahana' && decision.prakashMorningDays) {
    // Default owner is Shraddha; on the two chosen mornings, Prakash takes it.
    return decision.prakashMorningDays.includes(weekdayCode(dateISO))
      ? 'prakash'
      : 'shraddha';
  }
  return routine.owner;
}

/** Materialise every occurrence of every routine in the [fromISO, toISO] window. */
export function expandOccurrences(
  routines: Routine[],
  fromISO: string,
  toISO: string,
  decisions: WeeklyDecision[] = []
): Occurrence[] {
  const out: Occurrence[] = [];
  for (const routine of routines) {
    if (routine.category === 'reference' || !routine.rrule) continue;
    for (const date of localDates(routine, fromISO, toISO)) {
      out.push({
        routine,
        date,
        startLocal: routine.startLocal,
        endLocal: routine.endLocal,
        startMinutes: toMinutes(routine.startLocal),
        endMinutes: toMinutes(routine.endLocal),
        effectiveOwner: effectiveOwner(routine, date, decisions)
      });
    }
  }
  return out;
}

/** Occurrences on a single local date, sorted by start time (markers last). */
export function occurrencesForDate(
  routines: Routine[],
  dateISO: string,
  decisions: WeeklyDecision[] = []
): Occurrence[] {
  return expandOccurrences(routines, dateISO, dateISO, decisions).sort((a, b) => {
    if (a.routine.marker !== b.routine.marker) return a.routine.marker ? 1 : -1;
    return a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes;
  });
}

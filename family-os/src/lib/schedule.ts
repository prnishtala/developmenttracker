import { Occurrence, View, WeeklyDecision } from './types';
import { occurrencesForDate } from './recurrence';
import { isInView } from './categories';
import { SCHEDULED_ROUTINES } from '@/data/seed';

/** Occurrences for one local date, filtered to a view and sorted. */
export function dayOccurrences(
  dateISO: string,
  view: View,
  decisions: WeeklyDecision[]
): Occurrence[] {
  return occurrencesForDate(SCHEDULED_ROUTINES, dateISO, decisions).filter((o) =>
    isInView(o.effectiveOwner, view)
  );
}

/** Does a block (possibly wrapping past midnight) contain `nowMin`? */
export function isActive(o: Occurrence, nowMin: number): boolean {
  if (o.routine.marker) return false;
  const { startMinutes: s, endMinutes: e } = o;
  if (s === e) return false;
  return s < e ? nowMin >= s && nowMin < e : nowMin >= s || nowMin < e;
}

export interface NowSplit {
  current?: Occurrence;
  next?: Occurrence;
  rest: Occurrence[];
  markers: Occurrence[];
}

/**
 * Split a day's occurrences into the current block, the next block, and the
 * remaining upcoming blocks — the shape the Now screen renders.
 */
export function splitNow(occurrences: Occurrence[], nowMin: number): NowSplit {
  const timed = occurrences.filter((o) => !o.routine.marker);
  const markers = occurrences.filter((o) => o.routine.marker);
  const current = timed.find((o) => isActive(o, nowMin));
  const upcoming = timed
    .filter((o) => o.startMinutes >= nowMin && o !== current)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const [next, ...rest] = upcoming;
  return { current, next, rest, markers };
}

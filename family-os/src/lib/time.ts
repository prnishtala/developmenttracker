import { DateTime } from 'luxon';

export const TZ = 'America/Chicago';

/** "HH:mm" -> minutes from local midnight. Returns 0 for empty. */
export function toMinutes(hhmm: string): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

/** minutes from local midnight -> "HH:mm" (24h). */
export function fromMinutes(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** "HH:mm" (24h) -> "6:45 AM" style label. */
export function label12h(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Current local date "YYYY-MM-DD" in the family timezone. */
export function todayLocal(now?: DateTime): string {
  return (now ?? DateTime.now().setZone(TZ)).toISODate() as string;
}

/** Current minutes-from-midnight in the family timezone. */
export function nowMinutes(now?: DateTime): number {
  const dt = now ?? DateTime.now().setZone(TZ);
  return dt.hour * 60 + dt.minute;
}

/** Monday (ISO week start) for the given local date, as "YYYY-MM-DD". */
export function weekStart(dateISO: string): string {
  return DateTime.fromISO(dateISO, { zone: TZ }).startOf('week').toISODate() as string;
}

/** Two-letter weekday code (MO,TU,...) used by RRULE BYDAY, for a local date. */
export function weekdayCode(dateISO: string): string {
  const codes = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  return codes[DateTime.fromISO(dateISO, { zone: TZ }).weekday - 1];
}

/** Friendly date heading, e.g. "Monday, Jul 6". */
export function dateHeading(dateISO: string): string {
  return DateTime.fromISO(dateISO, { zone: TZ }).toFormat('cccc, LLL d');
}

export function addDaysISO(dateISO: string, days: number): string {
  return DateTime.fromISO(dateISO, { zone: TZ }).plus({ days }).toISODate() as string;
}

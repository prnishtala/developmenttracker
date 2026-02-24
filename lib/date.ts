import { format, isAfter, isBefore, parseISO, subDays } from 'date-fns';

export const FALLBACK_TIME_ZONE = 'America/Chicago';

export function normalizeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return FALLBACK_TIME_ZONE;

  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

export function getDateInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return format(date, 'yyyy-MM-dd');
  }

  return `${year}-${month}-${day}`;
}

export function isDateWithinBackRange(targetDate: string, maxDate: string, maxDaysBack: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return false;

  const parsedTarget = parseISO(targetDate);
  const parsedMax = parseISO(maxDate);
  const parsedMin = subDays(parsedMax, maxDaysBack);

  if (Number.isNaN(parsedTarget.getTime()) || Number.isNaN(parsedMax.getTime())) {
    return false;
  }

  return !isBefore(parsedTarget, parsedMin) && !isAfter(parsedTarget, parsedMax);
}

import { EventSetting, EventType } from '@/lib/types';

// Normalized shape produced by every ingestion adapter (ICS / JSON / HTML / AI).
// The discovery route stamps source_id / verified / last_checked_at before upsert.
export type ExtractedEvent = {
  title: string;
  description: string | null;
  event_date: string | null; // yyyy-mm-dd, or null for ongoing attractions
  start_time: string | null; // HH:MM (24h) or null
  end_time: string | null;
  venue_name: string | null;
  city: string;
  address: string | null;
  is_free: boolean;
  cost_text: string | null;
  setting: EventSetting;
  category: string;
  min_age_months: number | null;
  max_age_months: number | null;
  event_type: EventType;
  source_url: string;
  booking_url: string | null;
};

const VALID_SETTINGS: EventSetting[] = ['indoor', 'outdoor', 'both'];
const VALID_TYPES: EventType[] = ['one_time', 'recurring', 'attraction'];

export function normalizeSetting(value: unknown): EventSetting {
  return VALID_SETTINGS.includes(value as EventSetting) ? (value as EventSetting) : 'both';
}

export function normalizeEventType(value: unknown): EventType {
  return VALID_TYPES.includes(value as EventType) ? (value as EventType) : 'one_time';
}

export function normalizeCategory(value: unknown, fallback = 'Other'): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : fallback;
}

// Accepts yyyy-mm-dd (optionally with time) and returns just the date part, or null.
export function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

// Accepts HH:MM (24h) and returns it, or null. Tolerates a leading date/time blob.
export function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${match[2]}`;
}

export function toMonths(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 240) return null;
  return Math.round(num);
}

// Keeps a dated event only if it falls within [from, to]; attractions (null date) always pass.
export function isWithinWindow(eventDate: string | null, from: string, to: string): boolean {
  if (!eventDate) return true;
  return eventDate >= from && eventDate <= to;
}

// Turns loose adapter output into a clean ExtractedEvent, or null if unusable.
export function sanitizeExtractedEvent(
  raw: Partial<ExtractedEvent> & { title?: unknown; city?: unknown },
  defaults: { city: string; source_url: string; category: string }
): ExtractedEvent | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const sourceUrl =
    typeof raw.source_url === 'string' && raw.source_url.trim().startsWith('http')
      ? raw.source_url.trim()
      : defaults.source_url;

  const city = typeof raw.city === 'string' && raw.city.trim() ? raw.city.trim() : defaults.city;

  return {
    title,
    description: typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null,
    event_date: normalizeDate(raw.event_date),
    start_time: normalizeTime(raw.start_time),
    end_time: normalizeTime(raw.end_time),
    venue_name: typeof raw.venue_name === 'string' && raw.venue_name.trim() ? raw.venue_name.trim() : null,
    city,
    address: typeof raw.address === 'string' && raw.address.trim() ? raw.address.trim() : null,
    is_free: typeof raw.is_free === 'boolean' ? raw.is_free : true,
    cost_text: typeof raw.cost_text === 'string' && raw.cost_text.trim() ? raw.cost_text.trim() : null,
    setting: normalizeSetting(raw.setting),
    category: normalizeCategory(raw.category, defaults.category),
    min_age_months: toMonths(raw.min_age_months),
    max_age_months: toMonths(raw.max_age_months),
    event_type: normalizeEventType(raw.event_type),
    source_url: sourceUrl,
    booking_url:
      typeof raw.booking_url === 'string' && raw.booking_url.trim().startsWith('http') ? raw.booking_url.trim() : null
  };
}

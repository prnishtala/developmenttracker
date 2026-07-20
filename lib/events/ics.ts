import { ExtractedEvent, isWithinWindow, sanitizeExtractedEvent } from '@/lib/events/types';

// Minimal iCalendar (RFC 5545) VEVENT reader — no dependency. Handles line
// folding and the common DTSTART/DTEND/SUMMARY/LOCATION/DESCRIPTION/URL fields.
// Good enough for the LibCal/Communico feeds most library systems publish.

function unfoldLines(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

// Parses a DTSTART/DTEND value (with optional params) into { date, time }.
// Supports "YYYYMMDD", "YYYYMMDDTHHMMSS", and trailing "Z".
function parseIcsDate(value: string): { date: string | null; time: string | null } {
  const cleaned = value.trim();
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return { date: null, time: null };
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = match[4] && match[5] ? `${match[4]}:${match[5]}` : null;
  return { date, time };
}

function fieldValue(line: string): string {
  const colon = line.indexOf(':');
  return colon >= 0 ? line.slice(colon + 1) : '';
}

export function parseIcs(
  icsText: string,
  defaults: { city: string; source_url: string; category: string },
  window: { from: string; to: string }
): ExtractedEvent[] {
  const lines = unfoldLines(icsText);
  const events: ExtractedEvent[] = [];

  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {};
      continue;
    }
    if (line.startsWith('END:VEVENT')) {
      if (current) {
        const start = current.DTSTART ? parseIcsDate(current.DTSTART) : { date: null, time: null };
        const end = current.DTEND ? parseIcsDate(current.DTEND) : { date: null, time: null };
        const candidate = sanitizeExtractedEvent(
          {
            title: current.SUMMARY ? unescapeText(current.SUMMARY) : '',
            description: current.DESCRIPTION ? unescapeText(current.DESCRIPTION) : null,
            event_date: start.date,
            start_time: start.time,
            end_time: end.time,
            venue_name: current.LOCATION ? unescapeText(current.LOCATION) : null,
            address: current.LOCATION ? unescapeText(current.LOCATION) : null,
            source_url: current.URL || defaults.source_url,
            event_type: 'recurring'
          },
          defaults
        );
        if (candidate && isWithinWindow(candidate.event_date, window.from, window.to)) {
          events.push(candidate);
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    // Key is the part before the first ';' or ':' (drops params like ;TZID=...).
    const sepIndex = Math.min(
      ...[line.indexOf(':'), line.indexOf(';')].filter((i) => i >= 0).concat([line.length])
    );
    const key = line.slice(0, sepIndex).toUpperCase();
    if (['SUMMARY', 'DESCRIPTION', 'LOCATION', 'URL', 'DTSTART', 'DTEND'].includes(key)) {
      current[key] = fieldValue(line);
    }
  }

  return events;
}

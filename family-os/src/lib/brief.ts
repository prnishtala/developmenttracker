import { View, WeeklyDecision } from './types';
import { dayOccurrences } from './schedule';
import { addDaysISO, dateHeading, label12h, todayLocal } from './time';
import { isSupabaseConfigured, supabase } from './supabase';

/** Build the compact week payload the Edge Function summarises. */
function buildPayload(view: View, decisions: WeeklyDecision[]) {
  const start = todayLocal();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(start, i);
    return {
      date,
      weekday: dateHeading(date),
      items: dayOccurrences(date, view, decisions)
        .filter((o) => !o.routine.marker)
        .map((o) => ({
          time: label12h(o.startLocal),
          title: o.routine.title,
          owner: o.effectiveOwner
        }))
    };
  });
  return { view, days };
}

/** Fetch the optional week-ahead brief. Falls back to a local summary offline. */
export async function fetchWeekBrief(view: View, decisions: WeeklyDecision[]): Promise<string> {
  const payload = buildPayload(view, decisions);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('week-brief', { body: payload });
      if (!error && data?.brief) return data.brief as string;
    } catch {
      // fall through to local
    }
  }

  // Local fallback — no network / no Supabase configured.
  const lines = ['Week ahead:'];
  for (const d of payload.days) {
    const anchors = d.items
      .filter((i) => /batch cook|review|reset|costco|gym|pill|dinner/i.test(i.title))
      .slice(0, 3)
      .map((i) => i.title.split('—')[0].trim());
    lines.push(`• ${d.weekday.split(',')[0]}: ${anchors.length ? anchors.join(', ') : 'open / routine day'}`);
  }
  lines.push('Protect the batch cook and the two BP doses; the rest can flex.');
  return lines.join('\n');
}

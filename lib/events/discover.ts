import { EventSource } from '@/lib/types';
import { extractEventsFromHtml } from '@/lib/events/extract';
import { parseIcs } from '@/lib/events/ics';
import { ExtractedEvent, isWithinWindow, sanitizeExtractedEvent } from '@/lib/events/types';

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const content = Array.isArray(payload?.output) ? payload.output : [];
  return content
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

// Curated pass: pull real events from one trusted source, keyed off its type.
export async function discoverFromSource(
  source: EventSource,
  window: { from: string; to: string }
): Promise<ExtractedEvent[]> {
  const defaults = {
    city: source.city,
    source_url: source.url,
    category: source.category_hint || 'Other'
  };

  try {
    if (source.source_type === 'ics') {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'AhanaTracker/1.0 (family event finder)' },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) return [];
      return parseIcs(await response.text(), defaults, window);
    }

    if (source.source_type === 'html') {
      return extractEventsFromHtml(source, window);
    }

    // 'json' feeds and 'ai_discovery' rows are handled elsewhere / later.
    return [];
  } catch {
    return [];
  }
}

// Hybrid discovery pass: LLM surfaces additional DFW toddler events. These are
// UNVERIFIED by definition — the route stamps verified=false and the UI labels
// them "confirm at source". Strict sanitize + conservative prompt.
export async function discoverAiEvents(window: { from: string; to: string }): Promise<ExtractedEvent[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const defaults = { city: 'DFW', source_url: 'https://www.google.com/search', category: 'Other' };

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You suggest well-known, recurring, toddler-friendly (ages 1 to 3) events and family attractions in the Dallas-Fort Worth (DFW) metroplex for the date range ' +
                  window.from +
                  ' to ' +
                  window.to +
                  '. Only include places/programs you are confident are real and currently operating, and provide their official website as source_url. Prefer free options. Do NOT fabricate specific one-off dates you are unsure about — for recurring/ongoing things use null for event_date and set event_type to "recurring" or "attraction". Return JSON only: {"events":[{"title":string,"description":string,"event_date":"YYYY-MM-DD"|null,"start_time":"HH:MM"|null,"end_time":"HH:MM"|null,"venue_name":string,"city":string,"address":string|null,"is_free":boolean,"cost_text":string|null,"setting":"indoor|outdoor|both","category":"Storytime|Workshop|Animals/Farm|Train/Ride|Museum|Nature|Music|Festival|Other","min_age_months":number|null,"max_age_months":number|null,"event_type":"one_time|recurring|attraction","source_url":"https://..."}]}. Limit to at most 10 high-confidence items. If unsure, return {"events":[]}.'
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) return [];

    const rawText = extractResponseText(await response.json());
    if (!rawText) return [];

    let items: unknown[] = [];
    try {
      const parsed = JSON.parse(rawText);
      items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.events) ? parsed.events : [];
    } catch {
      return [];
    }

    const results: ExtractedEvent[] = [];
    for (const item of items) {
      const clean = sanitizeExtractedEvent(item as any, defaults);
      // Require a real official source_url for unverified items so the UI can link out.
      if (clean && clean.source_url.startsWith('http') && isWithinWindow(clean.event_date, window.from, window.to)) {
        results.push(clean);
      }
    }
    return results;
  } catch {
    return [];
  }
}

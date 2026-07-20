import { ExtractedEvent, sanitizeExtractedEvent, isWithinWindow } from '@/lib/events/types';

// LLM extraction of structured events from a venue's actual fetched page.
// Anchored to real page text (not open-web recall) to limit hallucination,
// and every field is sanitized before use. Mirrors lib/nutrition-openai.ts.

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const content = Array.isArray(payload?.output) ? payload.output : [];
  return content
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((part: any) => {
      if (typeof part?.text === 'string') return part.text;
      if (typeof part?.content === 'string') return part.content;
      return '';
    })
    .join('\n')
    .trim();
}

// Very small HTML→text reducer: drop scripts/styles/tags, collapse whitespace,
// and cap length so we stay within a sane token budget.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);
}

function parseJsonEvents(rawText: string): unknown[] {
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.events)) return parsed.events;
    return [];
  } catch {
    return [];
  }
}

export async function extractEventsFromHtml(
  source: { url: string; city: string; category_hint: string | null },
  window: { from: string; to: string }
): Promise<ExtractedEvent[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  let pageText: string;
  try {
    const pageResponse = await fetch(source.url, {
      headers: { 'User-Agent': 'AhanaTracker/1.0 (family event finder)' },
      signal: AbortSignal.timeout(12000)
    });
    if (!pageResponse.ok) return [];
    pageText = htmlToText(await pageResponse.text());
  } catch {
    return [];
  }

  if (!pageText) return [];

  const defaults = {
    city: source.city,
    source_url: source.url,
    category: source.category_hint || 'Other'
  };

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
                  'You extract toddler-friendly (roughly ages 1 to 3) local events from the provided web page text ONLY. Do not invent events, dates, times, or addresses — use only what is present in the text. Only include events dated between ' +
                  window.from +
                  ' and ' +
                  window.to +
                  '. Return JSON only with this exact shape: {"events":[{"title":string,"description":string,"event_date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","venue_name":string,"city":string,"address":string,"is_free":boolean,"cost_text":string,"setting":"indoor|outdoor|both","category":"Storytime|Workshop|Animals/Farm|Train/Ride|Museum|Nature|Music|Festival|Other","min_age_months":number,"max_age_months":number}]}. Use null for any field not stated. If no clearly dated toddler events are present, return {"events":[]}.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Source city: ${source.city}. Category hint: ${source.category_hint ?? 'none'}.\n\nPAGE TEXT:\n${pageText}`
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) return [];

    const payload = await response.json();
    const rawText = extractResponseText(payload);
    if (!rawText) return [];

    const items = parseJsonEvents(rawText);
    const results: ExtractedEvent[] = [];
    for (const item of items) {
      const clean = sanitizeExtractedEvent(item as any, defaults);
      if (clean && isWithinWindow(clean.event_date, window.from, window.to)) {
        results.push(clean);
      }
    }
    return results;
  } catch {
    return [];
  }
}

// Optional AI "week-ahead brief" — a Supabase Edge Function (Deno).
// Deliberately NOT a planner: it never regenerates the plan (that would
// reintroduce the daily decisions the OS exists to kill). It just reads the
// week's already-decided schedule back to you as a short, supportive brief.
//
// Deploy:  supabase functions deploy week-brief
// Secrets: supabase secrets set OPENAI_API_KEY=sk-...   (optional OPENAI_MODEL)
//
// Reuses the /v1/responses + strict-fallback pattern from the sibling web app's
// lib/nutrition-openai.ts. If no key is set, returns a clean rule-based brief.

interface DayIn {
  date: string;
  weekday: string;
  items: { time: string; title: string; owner: string }[];
}
interface Payload {
  view: string;
  days: DayIn[];
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function fallbackBrief(p: Payload): string {
  const lines = [`Week ahead — ${p.view} view:`];
  for (const d of p.days) {
    const anchors = d.items
      .filter((i) => /batch cook|review|reset|costco|gym|pill|walk|dinner/i.test(i.title))
      .slice(0, 3)
      .map((i) => i.title.split('—')[0].trim());
    lines.push(`• ${d.weekday}: ${anchors.length ? anchors.join(', ') : 'open / routine day'}`);
  }
  lines.push('One thing to protect this week: the batch cook and the two BP doses. Everything else can flex.');
  return lines.join('\n');
}

function extractText(payload: any): string {
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const payload = (await req.json()) as Payload;
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      return Response.json({ brief: fallbackBrief(payload), source: 'fallback' }, { headers: cors });
    }

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You are a calm assistant for a family operating system. You are given the coming week\'s ALREADY-DECIDED schedule. Do NOT invent, replan, or suggest new activities — the plan is fixed on purpose. Write a short, warm brief (max ~120 words): the shape of the week, which 2–3 anchors matter most (batch cook, reviews, medication, gym), and one gentle heads-up if the week looks heavy. Plain text, a few short lines. No markdown headers.'
              }
            ]
          },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(payload) }] }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) {
      return Response.json({ brief: fallbackBrief(payload), source: 'fallback' }, { headers: cors });
    }
    const data = await resp.json();
    const brief = extractText(data) || fallbackBrief(payload);
    return Response.json({ brief, source: 'openai' }, { headers: cors });
  } catch (_e) {
    return Response.json({ brief: 'Could not generate a brief right now.', source: 'error' }, { headers: cors });
  }
});

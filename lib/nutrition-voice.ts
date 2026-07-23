import { MEAL_TYPES, QUANTITY_OPTIONS } from '@/lib/constants';

// Turns a free-form spoken recap ("she had two idlis and half a banana for
// breakfast, skipped lunch, dal rice at dinner") into structured meal entries
// aligned to the app's meal slots, ready to drop into nutrition_logs.

export type ExtractedMeal = {
  mealType: string;
  mealNotes: string;
  quantity: string; // one of QUANTITY_OPTIONS
};

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

function normalizeQuantity(value: unknown): string {
  if (typeof value === 'string') {
    const match = QUANTITY_OPTIONS.find((option) => option.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return 'Normal';
}

// Snaps a free-text meal label onto one of the known slots when it clearly
// matches; otherwise keeps the caretaker's own label (custom meals are allowed).
function normalizeMealType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const exact = MEAL_TYPES.find((meal) => meal.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('breakfast')) return 'Breakfast';
  if (lower.includes('mid') && lower.includes('morning')) return 'Mid-morning snack';
  if (lower.includes('lunch')) return 'Lunch';
  if ((lower.includes('pre') && lower.includes('dinner')) || lower.includes('evening snack')) return 'Pre-dinner snack';
  if (lower.includes('dinner') || lower.includes('supper')) return 'Dinner';
  if (lower.includes('milk')) return 'A2 milk';
  return raw.slice(0, 60);
}

function sanitizeMeals(payload: unknown): ExtractedMeal[] {
  const meals = Array.isArray((payload as { meals?: unknown[] })?.meals)
    ? (payload as { meals: unknown[] }).meals
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  const seen = new Set<string>();
  const result: ExtractedMeal[] = [];
  for (const raw of meals) {
    const item = raw as { mealType?: unknown; meal?: unknown; mealNotes?: unknown; notes?: unknown; quantity?: unknown };
    const mealType = normalizeMealType(item.mealType ?? item.meal);
    const notes = typeof item.mealNotes === 'string' ? item.mealNotes : typeof item.notes === 'string' ? item.notes : '';
    if (!mealType || !notes.trim()) continue;
    const key = mealType.toLowerCase();
    if (seen.has(key)) continue; // one entry per slot; first wins
    seen.add(key);
    result.push({ mealType, mealNotes: notes.trim().slice(0, 400), quantity: normalizeQuantity(item.quantity) });
  }
  return result;
}

export async function extractMealsFromTranscript(transcript: string): Promise<ExtractedMeal[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const text = transcript?.trim();
  if (!apiKey || !text) return [];

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You convert a caretaker\'s spoken recap of what a toddler ate into structured meal entries. Use ONLY what the recap states — do not invent foods or amounts. Map each meal to one of these slots when it fits: ' +
                  MEAL_TYPES.join(', ') +
                  '. If a described eating occasion does not fit those, use a short custom label. Combine everything said about one slot into a single clear mealNotes string (e.g. "1 idli, half banana, few spoons curd"). Estimate quantity as one of ' +
                  QUANTITY_OPTIONS.join(', ') +
                  ' from cues like "ate all", "few bites", "half". Skip meals the child clearly refused or did not eat. Return JSON only: {"meals":[{"mealType":string,"mealNotes":string,"quantity":"Low|Normal|High"}]}. If nothing edible is described, return {"meals":[]}.'
              }
            ]
          },
          { role: 'user', content: [{ type: 'input_text', text }] }
        ]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) return [];
    const rawText = extractResponseText(await response.json());
    if (!rawText) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return [];
    }
    return sanitizeMeals(parsed);
  } catch {
    return [];
  }
}

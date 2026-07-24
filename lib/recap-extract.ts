import { MEAL_TYPES, QUANTITY_OPTIONS, VITAMIN_C_FRUITS } from '@/lib/constants';

// One-shot extraction of a full end-of-day recap into everything the trackers
// need: meals, naps, care (supplements/bath), and which planned activities were
// done. Anchored to the caretaker's words; every field sanitized.

export type RecapMeal = { mealType: string; mealNotes: string; quantity: string };
export type RecapNap = { startTime: string | null; endTime: string | null };
export type RecapCare = {
  ironDrops: boolean;
  multivitamin: boolean;
  vitaminC: boolean;
  vitaminCFruit: string | null;
  bath: boolean;
};
export type RecapActivity = { name: string; completed: boolean };

export type RecapExtract = {
  meals: RecapMeal[];
  naps: RecapNap[];
  care: RecapCare;
  activities: RecapActivity[];
  misc: string;
};

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const content = Array.isArray(payload?.output) ? payload.output : [];
  return content
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${m[2]}`;
}

function normalizeQuantity(value: unknown): string {
  if (typeof value === 'string') {
    const match = QUANTITY_OPTIONS.find((o) => o.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return 'Normal';
}

function normalizeMealType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const exact = MEAL_TYPES.find((m) => m.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('breakfast')) return 'Breakfast';
  if (lower.includes('mid') && lower.includes('morning')) return 'Mid-morning snack';
  if (lower.includes('lunch')) return 'Lunch';
  if ((lower.includes('pre') && lower.includes('dinner')) || lower.includes('evening snack')) return 'Pre-dinner snack';
  if (lower.includes('dinner') || lower.includes('supper')) return 'Dinner';
  if (lower.includes('milk')) return 'A2 milk';
  return raw.slice(0, 60);
}

function normalizeFruit(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = VITAMIN_C_FRUITS.find((f) => f.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}

function sanitize(payload: unknown, plannedNames: string[]): RecapExtract {
  const obj = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;

  const mealsRaw = Array.isArray(obj.meals) ? obj.meals : [];
  const meals: RecapMeal[] = [];
  const seenMeal = new Set<string>();
  for (const raw of mealsRaw) {
    const item = raw as Record<string, unknown>;
    const mealType = normalizeMealType(item.mealType ?? item.meal);
    const notes = typeof item.mealNotes === 'string' ? item.mealNotes : typeof item.notes === 'string' ? item.notes : '';
    if (!mealType || !notes.trim()) continue;
    if (seenMeal.has(mealType.toLowerCase())) continue;
    seenMeal.add(mealType.toLowerCase());
    meals.push({ mealType, mealNotes: notes.trim().slice(0, 400), quantity: normalizeQuantity(item.quantity) });
  }

  const napsRaw = Array.isArray(obj.naps) ? obj.naps : [];
  const naps: RecapNap[] = [];
  for (const raw of napsRaw) {
    const item = raw as Record<string, unknown>;
    const startTime = normalizeTime(item.startTime ?? item.start);
    const endTime = normalizeTime(item.endTime ?? item.end);
    if (startTime || endTime) naps.push({ startTime, endTime });
  }

  const careRaw = (obj.care && typeof obj.care === 'object' ? obj.care : {}) as Record<string, unknown>;
  const care: RecapCare = {
    ironDrops: careRaw.ironDrops === true,
    multivitamin: careRaw.multivitamin === true,
    vitaminC: careRaw.vitaminC === true,
    vitaminCFruit: normalizeFruit(careRaw.vitaminCFruit),
    bath: careRaw.bath === true
  };

  // Match extracted activity names to the day's planned activities.
  const activitiesRaw = Array.isArray(obj.activities) ? obj.activities : [];
  const activities: RecapActivity[] = [];
  const seenAct = new Set<string>();
  for (const raw of activitiesRaw) {
    const item = raw as Record<string, unknown>;
    const spoken = typeof item.name === 'string' ? item.name.trim() : '';
    if (!spoken) continue;
    const lower = spoken.toLowerCase();
    const match = plannedNames.find((n) => n.toLowerCase() === lower || n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase()));
    const name = match ?? spoken;
    if (seenAct.has(name.toLowerCase())) continue;
    seenAct.add(name.toLowerCase());
    activities.push({ name, completed: item.completed !== false });
  }

  const misc = typeof obj.misc === 'string' ? obj.misc.trim().slice(0, 1000) : '';

  return { meals, naps, care, activities, misc };
}

export async function extractRecap(transcript: string, plannedNames: string[]): Promise<RecapExtract> {
  const apiKey = process.env.OPENAI_API_KEY;
  const text = transcript?.trim();
  const empty: RecapExtract = { meals: [], naps: [], care: { ironDrops: false, multivitamin: false, vitaminC: false, vitaminCFruit: null, bath: false }, activities: [], misc: '' };
  if (!apiKey || !text) return empty;

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
                  "You convert a caretaker's spoken end-of-day recap of a toddler's day into structured data. Use ONLY what is said. Extract four things: " +
                  '(1) meals: array of {mealType, mealNotes, quantity}. Map mealType to one of: ' +
                  MEAL_TYPES.join(', ') +
                  ' (or a short custom label). quantity is one of ' +
                  QUANTITY_OPTIONS.join(', ') +
                  '. Skip refused meals. ' +
                  '(2) naps: array of {startTime, endTime} in 24h HH:MM; use null for a time not stated. ' +
                  '(3) care: {ironDrops, multivitamin, vitaminC, vitaminCFruit, bath} — booleans for whether iron drops, a multivitamin, vitamin C, and a bath happened; vitaminCFruit is one of ' +
                  VITAMIN_C_FRUITS.join(', ') +
                  ' or null. Only set true when clearly stated. ' +
                  '(4) activities: array of {name, completed} for any play/development activities mentioned as done. Prefer matching these planned activity names when they fit: ' +
                  (plannedNames.length ? plannedNames.join('; ') : '(none planned today)') +
                  '. (5) misc: a single plain-text string capturing EVERYTHING ELSE mentioned that does not clearly fit the fields above — extra snacks you could not slot, activities that are not in the planned list, extra or night sleep beyond naps, mood, health/teething notes, outings, or any other observation. Never drop information: if in doubt, put it in misc. Return JSON only with exactly {"meals":[...],"naps":[...],"care":{...},"activities":[...],"misc":"..."}. Use empty arrays, false, and "" where nothing is said.'
              }
            ]
          },
          { role: 'user', content: [{ type: 'input_text', text }] }
        ]
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) return empty;
    const rawText = extractResponseText(await response.json());
    if (!rawText) return empty;
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return empty;
    }
    return sanitize(parsed, plannedNames);
  } catch {
    return empty;
  }
}

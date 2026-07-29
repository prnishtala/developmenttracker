import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SKILL_TAGS,
  CATEGORY_DEFAULT_SKILLS,
  DURATION_OPTIONS,
  MEAL_TYPES,
  QUANTITY_OPTIONS,
  VITAMIN_C_FRUITS
} from '@/lib/constants';

// One-shot extraction of a full end-of-day recap into everything the trackers
// need: meals (including ad-hoc ones), naps, care (supplements/bath), and the
// development activities that happened — matched to the day's plan when they
// fit, or classified into a domain so they can be logged on the fly. Anchored
// to the caretaker's words; every field sanitized. Only genuinely
// uncategorizable observations land in `misc`.

export type RecapMeal = { mealType: string; mealNotes: string; quantity: string };
export type RecapNap = { startTime: string | null; endTime: string | null };
export type RecapCare = {
  ironDrops: boolean;
  multivitamin: boolean;
  vitaminC: boolean;
  vitaminCFruit: string | null;
  bath: boolean;
};
export type RecapActivity = {
  name: string;
  completed: boolean;
  category: string;
  skillTags: string[];
  duration: string;
};

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

function normalizeCategory(value: unknown, skillTags: string[]): string {
  if (typeof value === 'string') {
    const match = ACTIVITY_CATEGORIES.find((c) => c.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  // Infer from skill tags when the category is missing or unknown.
  if (skillTags.some((t) => t === 'Gross Motor' || t === 'Balance')) return 'Movement';
  if (skillTags.includes('Fine Motor')) return 'Fine Motor';
  if (skillTags.some((t) => ['Vocabulary', 'Expressive Language', 'Receptive Language'].includes(t))) return 'Language';
  if (skillTags.includes('Sensory Integration')) return 'Sensory';
  return 'Social Emotional';
}

function parseSkillTags(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [];
  const cleaned: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const match = ACTIVITY_SKILL_TAGS.find((t) => t.toLowerCase() === item.trim().toLowerCase());
    if (match && !cleaned.includes(match)) cleaned.push(match);
  }
  return cleaned.slice(0, 4);
}

function normalizeDuration(value: unknown): string {
  if (typeof value === 'string') {
    const match = DURATION_OPTIONS.find((o) => o.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  // Accept a raw number of minutes and bucket it.
  const minutes = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^\d.]/g, '')) : NaN;
  if (Number.isFinite(minutes)) {
    if (minutes <= 5) return '0 to 5';
    if (minutes <= 10) return '5 to 10';
    if (minutes <= 20) return '10 to 20';
    return '20 plus';
  }
  return '5 to 10';
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
  const vitaminCFruit = normalizeFruit(careRaw.vitaminCFruit);
  const care: RecapCare = {
    ironDrops: careRaw.ironDrops === true,
    multivitamin: careRaw.multivitamin === true,
    // Any recognized vitamin-C fruit implies coverage even if the model forgot
    // to flip the boolean (e.g. caretaker just said "she had kiwi").
    vitaminC: careRaw.vitaminC === true || vitaminCFruit !== null,
    vitaminCFruit,
    bath: careRaw.bath === true
  };

  // Match extracted activity names to the day's planned activities; classify
  // every activity into a domain so off-plan ones can still be logged.
  const activitiesRaw = Array.isArray(obj.activities) ? obj.activities : [];
  const activities: RecapActivity[] = [];
  const seenAct = new Set<string>();
  for (const raw of activitiesRaw) {
    const item = raw as Record<string, unknown>;
    const spoken = typeof item.name === 'string' ? item.name.trim() : '';
    if (!spoken) continue;
    const lower = spoken.toLowerCase();
    const match = plannedNames.find((n) => n.toLowerCase() === lower || n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase()));
    const name = (match ?? spoken).slice(0, 80);
    if (seenAct.has(name.toLowerCase())) continue;
    seenAct.add(name.toLowerCase());
    const rawTags = parseSkillTags(item.skillTags ?? item.skills);
    const category = normalizeCategory(item.category, rawTags);
    const skillTags = rawTags.length ? rawTags : CATEGORY_DEFAULT_SKILLS[category] ?? ['Attention'];
    activities.push({
      name,
      completed: item.completed !== false,
      category,
      skillTags,
      duration: normalizeDuration(item.duration ?? item.durationMinutes)
    });
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
                  "You convert a caretaker's spoken end-of-day recap of a toddler's day into structured data. Use ONLY what is said, but classify it generously so nothing useful is lost to a catch-all. Extract five things: " +
                  '(1) meals: array of {mealType, mealNotes, quantity}. Map mealType to one of: ' +
                  MEAL_TYPES.join(', ') +
                  '. If a food was clearly eaten but does not fit one of those slots (an extra snack, fruit, a treat, a post-nap bite), STILL return it as a meal with a short custom mealType label like "Ad hoc snack" or "Fruit" — do NOT drop it into misc. Put the actual food in mealNotes. quantity is one of ' +
                  QUANTITY_OPTIONS.join(', ') +
                  '. Skip only meals that were refused/not eaten. ' +
                  '(2) naps: array of {startTime, endTime} in 24h HH:MM; use null for a time not stated. Include every nap mentioned. ' +
                  '(3) care: {ironDrops, multivitamin, vitaminC, vitaminCFruit, bath}. ironDrops/multivitamin/bath are booleans set true only when clearly stated. For vitamin C: set vitaminC=true AND set vitaminCFruit whenever the child ate a vitamin-C-rich fruit, EVEN IF the words "vitamin C" were never said. vitaminCFruit must be one of ' +
                  VITAMIN_C_FRUITS.join(', ') +
                  ' (map synonyms: sweet lime/sweet lemon->Mosambi; strawberries->Strawberry; kiwifruit->Kiwi), otherwise null. Kiwi, orange, guava, papaya, mosambi and strawberry are all vitamin-C fruits. ' +
                  '(4) activities: array of {name, completed, category, skillTags, duration} for EVERY play/development/outing/motor moment mentioned as happening — not only the planned ones. Reuse one of these planned names when it clearly fits: ' +
                  (plannedNames.length ? plannedNames.join('; ') : '(none planned today)') +
                  '. Otherwise write a short natural name for what happened (e.g. "Played with balls downstairs", "Stacked cups"). category MUST be one of ' +
                  ACTIVITY_CATEGORIES.join(', ') +
                  '. skillTags is 1-3 items from ' +
                  ACTIVITY_SKILL_TAGS.join(', ') +
                  ' that best fit the activity (e.g. going down stairs and running = Movement/[Gross Motor, Balance]; naming animals = Language/[Vocabulary, Expressive Language]; playing with cousins = Social Emotional/[Emotional Regulation]). duration is one of ' +
                  DURATION_OPTIONS.join(', ') +
                  " (minutes), your best estimate from the recap, default '5 to 10'. Do NOT leave described play out of this list. " +
                  '(5) misc: a single plain-text string capturing ONLY things that truly do not fit any field above — mood, health/teething notes, weather, logistics, general observations. Do NOT put foods, naps, supplements, baths, or activities here; those belong in their own fields. Return JSON only with exactly {"meals":[...],"naps":[...],"care":{...},"activities":[...],"misc":"..."}. Use empty arrays, false, and "" where nothing is said.'
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

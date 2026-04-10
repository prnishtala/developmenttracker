import {
  estimateNutritionFromNoteHeuristic,
  MealNutritionEstimate,
  NutritionConfidence,
  roundNutrients
} from '@/lib/nutrition-ai';

export type MealNutritionInput = {
  id: string;
  date: string;
  mealType: string;
  quantity: string | null;
  mealNotes: string | null;
};

type OpenAIMealEstimate = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_c_mg: number;
  recognizedFoods: string[];
  confidence: NutritionConfidence;
};

type OpenAIMealResponse = {
  results: OpenAIMealEstimate[];
};

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

function buildFallbackResults(entries: MealNutritionInput[]): Map<string, MealNutritionEstimate> {
  return new Map(
    entries.map((entry) => [
      entry.id,
      estimateNutritionFromNoteHeuristic(entry.mealNotes, entry.quantity)
    ])
  );
}

function normalizeConfidence(value: unknown): NutritionConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'low';
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }
  return numberValue;
}

function sanitizeEstimate(raw: any, fallback: MealNutritionEstimate): MealNutritionEstimate {
  const calories = toFiniteNumber(raw?.calories);
  const protein_g = toFiniteNumber(raw?.protein_g);
  const carbs_g = toFiniteNumber(raw?.carbs_g);
  const fat_g = toFiniteNumber(raw?.fat_g);
  const iron_mg = toFiniteNumber(raw?.iron_mg);
  const calcium_mg = toFiniteNumber(raw?.calcium_mg);
  const vitamin_c_mg = toFiniteNumber(raw?.vitamin_c_mg);
  const recognizedFoods = Array.isArray(raw?.recognizedFoods)
    ? raw.recognizedFoods.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback.recognizedFoods;

  if (
    calories === null ||
    protein_g === null ||
    carbs_g === null ||
    fat_g === null ||
    iron_mg === null ||
    calcium_mg === null ||
    vitamin_c_mg === null
  ) {
    return fallback;
  }

  const confidence = normalizeConfidence(raw?.confidence);
  const rounded = roundNutrients({
    calories,
    protein_g,
    carbs_g,
    fat_g,
    iron_mg,
    calcium_mg,
    vitamin_c_mg
  });

  return {
    ...rounded,
    recognizedFoods,
    confidence,
    source: 'openai'
  };
}

function sanitizeResponse(payload: unknown, entries: MealNutritionInput[], fallbackResults: Map<string, MealNutritionEstimate>) {
  if (!payload || typeof payload !== 'object') {
    return fallbackResults;
  }

  const results = Array.isArray((payload as OpenAIMealResponse).results) ? (payload as OpenAIMealResponse).results : null;
  if (!results || results.length !== entries.length) {
    return fallbackResults;
  }

  const sanitized = new Map<string, MealNutritionEstimate>();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const fallback = fallbackResults.get(entry.id);
    if (!fallback) {
      continue;
    }
    sanitized.set(entry.id, sanitizeEstimate(results[index], fallback));
  }

  return sanitized.size === entries.length ? sanitized : fallbackResults;
}

export async function estimateMealNutritionBatch(entries: MealNutritionInput[]): Promise<Map<string, MealNutritionEstimate>> {
  const fallbackResults = buildFallbackResults(entries);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || entries.length === 0) {
    return fallbackResults;
  }

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
                  'You are a nutrition estimation engine for toddler meal logs. Read only the meal note text, meal type, and quantity hint. Estimate calories, protein, carbs, fat, iron, calcium, and vitamin C for each meal independently. Use conservative, approximate values and do not browse the web. If the meal text is vague or empty, return zeros and low confidence. Return JSON only with this exact shape: {"results":[{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"iron_mg":number,"calcium_mg":number,"vitamin_c_mg":number,"recognizedFoods":["..."],"confidence":"high|medium|low"}]}. Keep the results in the same order as the input.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify(
                  entries.map((entry) => ({
                    id: entry.id,
                    date: entry.date,
                    mealType: entry.mealType,
                    quantity: entry.quantity,
                    mealNotes: entry.mealNotes
                  }))
                )
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return fallbackResults;
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);
    if (!rawText) {
      return fallbackResults;
    }

    const parsed = JSON.parse(rawText) as unknown;
    return sanitizeResponse(parsed, entries, fallbackResults);
  } catch {
    return fallbackResults;
  }
}

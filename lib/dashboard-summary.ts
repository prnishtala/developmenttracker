import { DashboardNarrative } from '@/lib/types';

export type DashboardNarrativeFacts = {
  snapshotDate: string;
  daysWithMeals: number;
  fullyLoggedDays: number;
  averageMealsPerDay: number;
  notesCoveragePercent: number;
  recognizableMealsPercent: number;
  averageCalories: number;
  calorieCoveragePercent: number;
  supplementIronMg: number;
  supplementIronDays: number;
  lowNutrients: string[];
  strongNutrients: string[];
  developmentSummary: string;
  careSummary: string;
};

function buildDataQuality(facts: DashboardNarrativeFacts): string {
  if (facts.daysWithMeals <= 4) {
    return `Low confidence: only ${facts.daysWithMeals} of the last 14 days have meal logs.`;
  }

  if (facts.notesCoveragePercent < 60 || facts.recognizableMealsPercent < 50) {
    return 'Medium confidence: several meal logs are missing notes or use foods the nutrition estimator cannot map yet.';
  }

  return 'High confidence: meal logging has enough detail to highlight likely nutrition patterns.';
}

function buildHeadline(facts: DashboardNarrativeFacts): string {
  if (facts.daysWithMeals <= 4) {
    return 'Nutrition insight is limited because meal logging is sparse.';
  }

  if (facts.lowNutrients.length >= 2) {
    return `${facts.lowNutrients[0]} and ${facts.lowNutrients[1]} look under target based on logged meals.`;
  }

  if (facts.lowNutrients.length === 1) {
    return `${facts.lowNutrients[0]} is the main nutrition gap right now.`;
  }

  if (facts.strongNutrients.length >= 2) {
    return `${facts.strongNutrients[0]} and ${facts.strongNutrients[1]} are trending well across recent logs.`;
  }

  return 'Meals look reasonably balanced based on the recent logs.';
}

function buildSummary(facts: DashboardNarrativeFacts): string {
  const calorieText =
    facts.calorieCoveragePercent >= 90
      ? 'Calorie intake appears close to the toddler target on logged days.'
      : 'Calorie intake appears below the toddler target on logged days.';

  const supplementText =
    facts.supplementIronMg > 0
      ? `Iron drops and multivitamin drops add ${facts.supplementIronMg} mg elemental iron across ${facts.supplementIronDays} care days.`
      : '';

  return `${calorieText} ${supplementText} ${facts.developmentSummary} ${facts.careSummary}`.trim();
}

function buildStrengths(facts: DashboardNarrativeFacts): string[] {
  const strengths: string[] = [];

  if (facts.fullyLoggedDays >= 7) {
    strengths.push(`${facts.fullyLoggedDays} of the last 14 days have all three meals logged.`);
  }

  if (facts.strongNutrients.length > 0) {
    strengths.push(`${facts.strongNutrients.join(' and ')} are meeting target more consistently than other nutrients.`);
  }

  if (facts.notesCoveragePercent >= 75) {
    strengths.push('Meal notes are detailed enough to produce more specific nutrition feedback.');
  }

  return strengths.slice(0, 3);
}

function buildConcerns(facts: DashboardNarrativeFacts): string[] {
  const concerns: string[] = [];

  if (facts.daysWithMeals < 7) {
    concerns.push(`Only ${facts.daysWithMeals} of the last 14 days include any meal logs.`);
  }

  if (facts.lowNutrients.length > 0) {
    concerns.push(`${facts.lowNutrients.join(' and ')} are falling short most often in the logged meals.`);
  }

  if (facts.averageMealsPerDay < 2.2) {
    concerns.push('Meal consistency looks uneven, so intake may be underreported or genuinely light on some days.');
  }

  if (facts.recognizableMealsPercent < 60) {
    concerns.push('Many meal notes use foods the estimator cannot match yet, which lowers nutrition confidence.');
  }

  return concerns.slice(0, 3);
}

function buildActions(facts: DashboardNarrativeFacts): string[] {
  const actions: string[] = [];

  if (facts.lowNutrients.includes('Protein')) {
    actions.push('Add one protein anchor daily: dal, curd, paneer, or egg.');
  }

  if (facts.lowNutrients.includes('Iron')) {
    actions.push('Pair iron foods like lentils or leafy dishes with a vitamin C fruit.');
    if (facts.supplementIronMg > 0) {
      actions.push('Remember that iron drops and multivitamins are already adding supplemental iron on care days.');
    }
  }

  if (facts.lowNutrients.includes('Calcium')) {
    actions.push('Use one calcium-rich serving each day such as curd, paneer, or ragi.');
  }

  if (facts.lowNutrients.includes('Vitamin C')) {
    actions.push('Include a fruit or vegetable with vitamin C in at least one meal each day.');
  }

  if (facts.daysWithMeals < 10 || facts.notesCoveragePercent < 70) {
    actions.push('Capture one short food note for each meal so the dashboard can estimate nutrients more reliably.');
  }

  if (actions.length === 0) {
    actions.push('Keep meal variety steady and continue logging notes so the trends stay trustworthy.');
  }

  return actions.slice(0, 3);
}

export function buildRuleBasedDashboardNarrative(facts: DashboardNarrativeFacts): DashboardNarrative {
  return {
    headline: buildHeadline(facts),
    summary: buildSummary(facts),
    strengths: buildStrengths(facts),
    concerns: buildConcerns(facts),
    actions: buildActions(facts),
    dataQuality: buildDataQuality(facts),
    source: 'rule-based'
  };
}

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const content = Array.isArray(payload?.output) ? payload.output : [];
  const text = content
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .map((part: any) => {
      if (typeof part?.text === 'string') return part.text;
      if (typeof part?.content === 'string') return part.content;
      return '';
    })
    .join('\n')
    .trim();

  return text;
}

function sanitizeNarrative(payload: any, fallback: DashboardNarrative): DashboardNarrative | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const headline = typeof payload.headline === 'string' ? payload.headline.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const dataQuality = typeof payload.dataQuality === 'string' ? payload.dataQuality.trim() : fallback.dataQuality;

  const strengths = Array.isArray(payload.strengths)
    ? payload.strengths.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback.strengths;
  const concerns = Array.isArray(payload.concerns)
    ? payload.concerns.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback.concerns;
  const actions = Array.isArray(payload.actions)
    ? payload.actions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    : fallback.actions;

  if (!headline || !summary || strengths.length === 0 || actions.length === 0) {
    return null;
  }

  return {
    headline,
    summary,
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 3),
    actions: actions.slice(0, 3),
    dataQuality,
    source: 'openai'
  };
}

export async function buildDashboardNarrative(facts: DashboardNarrativeFacts): Promise<DashboardNarrative> {
  const fallback = buildRuleBasedDashboardNarrative(facts);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallback;
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
                  'You write concise parent dashboard summaries for toddler meal and care tracking. Be factual, cautious, and non-diagnostic. Mention that nutrition is inferred from logged meals when relevant. Output JSON only with keys: headline, summary, strengths, concerns, actions, dataQuality. strengths/concerns/actions must be arrays of 2 or 3 short strings.'
              }
            ]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: JSON.stringify(facts) }]
          }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);
    const parsed = sanitizeNarrative(JSON.parse(rawText), fallback);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

import { CareLog, NutritionLog } from '@/lib/types';

// Rule-based check of a single day against the nutrition plan's pillars.
// Deterministic keyword matching on meal notes + the care log — no AI, so it
// works regardless of the OpenAI integration. Advisory, not clinical.

export type PillarStatus = 'met' | 'partial' | 'missing';

export type AdherencePillar = {
  key: string;
  label: string;
  status: PillarStatus;
  detail: string;
  tip?: string;
};

export type DailyAdherence = {
  score: number; // 0..100 across scored pillars
  metCount: number;
  totalCount: number;
  headline: string;
  pillars: AdherencePillar[];
  eggToday: boolean;
  milkServings: number;
};

const PROTEIN = ['egg', 'paneer', 'dal', 'daal', 'sambar', 'curd', 'dahi', 'yogurt', 'yoghurt', 'cheese', 'milk', 'tofu', 'besan', 'chilla', 'cheela', 'chila', 'moong', 'masoor', 'toor', 'rajma', 'chana', 'chhole', 'chole', 'chickpea', 'sprout', 'sattu', 'nut butter', 'peanut butter', 'almond butter'];
const IRON = ['ragi', 'palak', 'spinach', 'saag', 'dal', 'daal', 'sambar', 'egg', 'besan', 'date', 'dates', 'raisin', 'kishmish', 'poha', 'jaggery', 'gud', 'gur', 'tofu', 'apricot', 'pumpkin seed', 'sesame', 'til', 'sprout', 'methi'];
const VITC = ['orange', 'mosambi', 'sweet lime', 'guava', 'amla', 'tomato', 'lemon', 'nimbu', 'capsicum', 'bell pepper', 'strawberry', 'kiwi', 'papaya', 'pineapple', 'lime'];
const FAT = ['ghee', 'butter', 'nut', 'almond', 'cashew', 'walnut', 'peanut', 'seed', 'avocado', 'cheese', 'paneer', 'coconut', 'oil', 'malai', 'cream'];
const VEG = ['palak', 'spinach', 'carrot', 'beans', 'peas', 'lauki', 'gourd', 'tomato', 'capsicum', 'beet', 'pumpkin', 'potato', 'aloo', 'cauliflower', 'gobi', 'broccoli', 'cucumber', 'methi', 'sabzi', 'sabji', 'saag', 'brinjal', 'baingan', 'zucchini', 'veg', 'vegetable'];
const FRUIT = ['banana', 'apple', 'mango', 'papaya', 'guava', 'orange', 'mosambi', 'pear', 'berry', 'berries', 'strawberry', 'kiwi', 'pomegranate', 'anar', 'watermelon', 'grape', 'chikoo', 'sapota', 'plum', 'peach', 'fruit'];

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((word) => text.includes(word));
}

function statusFromCount(count: number, met: number, partial: number): PillarStatus {
  if (count >= met) return 'met';
  if (count >= partial) return 'partial';
  return 'missing';
}

export function computeDailyAdherence(logs: NutritionLog[], careLog: CareLog | null): DailyAdherence {
  const eaten = logs
    .filter((log) => log.had_meal && (log.meal_notes ?? '').trim().length > 0)
    .map((log) => ({ ...log, text: (log.meal_notes ?? '').toLowerCase() }));

  const eatenCount = eaten.length;
  const proteinMeals = eaten.filter((m) => matchesAny(m.text, PROTEIN)).length;
  const fatMeals = eaten.filter((m) => matchesAny(m.text, FAT)).length;
  const vegServings = eaten.filter((m) => matchesAny(m.text, VEG)).length;
  const fruitServings = eaten.filter((m) => matchesAny(m.text, FRUIT)).length;
  const dayHasIron = eaten.some((m) => matchesAny(m.text, IRON));
  const dayHasVitC = eaten.some((m) => matchesAny(m.text, VITC));
  const eggToday = eaten.some((m) => m.text.includes('egg'));
  const milkServings = eaten.filter((m) => m.text.includes('milk') || m.meal_type === 'A2 milk').length;

  const supplementsMet = Boolean(careLog?.iron_drops) && Boolean(careLog?.multivitamin_drops);
  const supplementsPartial = Boolean(careLog?.iron_drops) || Boolean(careLog?.multivitamin_drops);

  const pillars: AdherencePillar[] = [
    {
      key: 'protein',
      label: 'Protein at 3 meals',
      status: statusFromCount(proteinMeals, 3, 1),
      detail: `Protein in ${proteinMeals} of ${eatenCount || 0} logged meal${eatenCount === 1 ? '' : 's'}`,
      tip: proteinMeals >= 3 ? undefined : 'Add curd, paneer, dal or egg to another meal.'
    },
    {
      key: 'iron-vitc',
      label: 'Iron + vitamin C paired',
      status: dayHasIron && dayHasVitC ? 'met' : dayHasIron || dayHasVitC ? 'partial' : 'missing',
      detail: dayHasIron && dayHasVitC ? 'An iron food and a vitamin-C food today' : dayHasIron ? 'Iron food logged, vitamin C missing' : dayHasVitC ? 'Vitamin C logged, iron food missing' : 'Neither logged yet',
      tip:
        dayHasIron && dayHasVitC
          ? undefined
          : !dayHasIron
            ? 'Add an iron food (ragi, dal, palak, dates) with something tangy.'
            : 'Pair it with orange, mosambi, tomato or lemon to absorb the iron.'
    },
    {
      key: 'fat',
      label: 'Healthy fat each meal',
      status: eatenCount === 0 ? 'missing' : fatMeals >= Math.max(1, eatenCount - 1) ? 'met' : fatMeals >= 1 ? 'partial' : 'missing',
      detail: `Fat cue in ${fatMeals} of ${eatenCount || 0} meal${eatenCount === 1 ? '' : 's'}`,
      tip: eatenCount > 0 && fatMeals >= Math.max(1, eatenCount - 1) ? undefined : 'Add ¼ tsp ghee or a spoon of nut/seed powder.'
    },
    {
      key: 'veg-fruit',
      label: '2 veg + 2 fruit',
      status: vegServings >= 2 && fruitServings >= 2 ? 'met' : vegServings >= 1 || fruitServings >= 1 ? 'partial' : 'missing',
      detail: `${vegServings} veg · ${fruitServings} fruit logged`,
      tip: vegServings >= 2 && fruitServings >= 2 ? undefined : 'Aim for 2 veg + 2 fruit — a fruit snack or extra veg helps.'
    },
    {
      key: 'supplements',
      label: 'Iron drops + multivitamin',
      status: supplementsMet ? 'met' : supplementsPartial ? 'partial' : 'missing',
      detail: supplementsMet ? 'Both given today' : supplementsPartial ? 'Only one given' : 'Not logged yet',
      tip: supplementsMet ? undefined : 'Give iron drops + multivitamin, and log them in the Care tab.'
    }
  ];

  const metCount = pillars.filter((p) => p.status === 'met').length;
  const totalCount = pillars.length;
  const partialCount = pillars.filter((p) => p.status === 'partial').length;
  const score = Math.round(((metCount + partialCount * 0.5) / totalCount) * 100);
  const headline = score >= 85 ? 'On plan today' : score >= 55 ? 'Mostly on plan' : eatenCount === 0 ? 'Nothing logged yet' : 'Needs a boost';

  return { score, metCount, totalCount, headline, pillars, eggToday, milkServings };
}

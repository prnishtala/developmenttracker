type NutrientProfile = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_c_mg: number;
};

type FoodProfile = {
  key: string;
  aliases: string[];
  baseAmount: number;
  nutrientsPerBase: NutrientProfile;
};

const FOOD_CATALOG: FoodProfile[] = [
  {
    key: 'idli',
    aliases: ['idli', 'idlis'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 58, protein_g: 2, carbs_g: 12, fat_g: 0.4, iron_mg: 0.3, calcium_mg: 8, vitamin_c_mg: 0 }
  },
  {
    key: 'dosa',
    aliases: ['dosa', 'dosai'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 133, protein_g: 3.2, carbs_g: 20, fat_g: 4.5, iron_mg: 0.8, calcium_mg: 12, vitamin_c_mg: 0 }
  },
  {
    key: 'upma',
    aliases: ['upma'],
    baseAmount: 0.5,
    nutrientsPerBase: { calories: 96, protein_g: 2.8, carbs_g: 16, fat_g: 2.6, iron_mg: 0.6, calcium_mg: 11, vitamin_c_mg: 2 }
  },
  {
    key: 'khichdi',
    aliases: ['khichdi', 'khichri'],
    baseAmount: 0.5,
    nutrientsPerBase: { calories: 110, protein_g: 3.8, carbs_g: 18, fat_g: 2.3, iron_mg: 0.9, calcium_mg: 14, vitamin_c_mg: 2 }
  },
  {
    key: 'rice',
    aliases: ['rice', 'curd rice', 'jeera rice'],
    baseAmount: 0.5,
    nutrientsPerBase: { calories: 103, protein_g: 2.1, carbs_g: 22, fat_g: 0.2, iron_mg: 0.2, calcium_mg: 5, vitamin_c_mg: 0 }
  },
  {
    key: 'dal',
    aliases: ['dal', 'daal', 'sambar'],
    baseAmount: 0.5,
    nutrientsPerBase: { calories: 99, protein_g: 5.5, carbs_g: 15, fat_g: 1.1, iron_mg: 1.6, calcium_mg: 19, vitamin_c_mg: 2 }
  },
  {
    key: 'roti',
    aliases: ['roti', 'chapati', 'phulka'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 71, protein_g: 2.3, carbs_g: 12, fat_g: 1.1, iron_mg: 0.6, calcium_mg: 8, vitamin_c_mg: 0 }
  },
  {
    key: 'paneer',
    aliases: ['paneer'],
    baseAmount: 0.25,
    nutrientsPerBase: { calories: 80, protein_g: 4.7, carbs_g: 1.3, fat_g: 6.2, iron_mg: 0.1, calcium_mg: 120, vitamin_c_mg: 0 }
  },
  {
    key: 'curd',
    aliases: ['curd', 'yogurt', 'dahi'],
    baseAmount: 0.5,
    nutrientsPerBase: { calories: 74, protein_g: 4, carbs_g: 5, fat_g: 4, iron_mg: 0.1, calcium_mg: 140, vitamin_c_mg: 1 }
  },
  {
    key: 'banana',
    aliases: ['banana'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, iron_mg: 0.3, calcium_mg: 5, vitamin_c_mg: 9 }
  },
  {
    key: 'apple',
    aliases: ['apple'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, iron_mg: 0.2, calcium_mg: 11, vitamin_c_mg: 8 }
  },
  {
    key: 'egg',
    aliases: ['egg', 'eggs'],
    baseAmount: 1,
    nutrientsPerBase: { calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, iron_mg: 0.9, calcium_mg: 28, vitamin_c_mg: 0 }
  }
];

export const COMMON_INDIAN_FOOD_CHIPS = [
  'Idli',
  'Dosa',
  'Upma',
  'Khichdi',
  'Rice',
  'Dal',
  'Roti',
  'Paneer',
  'Curd',
  'Banana',
  'Apple',
  'Egg'
] as const;

const DEFAULT_MULTIPLIER_BY_QUANTITY: Record<string, number> = {
  Low: 0.7,
  Normal: 1,
  High: 1.3
};

const TODDLER_TARGETS = {
  calories: 1000,
  protein_g: 13,
  iron_mg: 7,
  calcium_mg: 700,
  vitamin_c_mg: 15
} as const;

export type NutrientEstimate = NutrientProfile;

export function zeroNutrients(): NutrientEstimate {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, iron_mg: 0, calcium_mg: 0, vitamin_c_mg: 0 };
}

function parseQuantityMultiplier(raw: string | null): number {
  if (!raw) return 1;
  return DEFAULT_MULTIPLIER_BY_QUANTITY[raw] ?? 1;
}

function parseAmountFromNotes(notes: string, aliases: string[]): number {
  const text = notes.toLowerCase();
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const numericPattern = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${escaped}\\b`);
    const numericMatch = text.match(numericPattern);
    if (numericMatch) {
      return Number(numericMatch[1]);
    }

    if (new RegExp(`half\\s+${escaped}\\b`).test(text) || new RegExp(`1\\/2\\s*${escaped}\\b`).test(text)) {
      return 0.5;
    }
  }

  return 1;
}

export function estimateNutritionFromNote(note: string | null, quantity: string | null): NutrientEstimate {
  if (!note || !note.trim()) return zeroNutrients();

  const text = note.toLowerCase();
  const multiplier = parseQuantityMultiplier(quantity);
  const totals = zeroNutrients();

  for (const food of FOOD_CATALOG) {
    const found = food.aliases.some((alias) => text.includes(alias));
    if (!found) continue;

    const amount = parseAmountFromNotes(text, food.aliases);
    const factor = (amount / food.baseAmount) * multiplier;
    totals.calories += food.nutrientsPerBase.calories * factor;
    totals.protein_g += food.nutrientsPerBase.protein_g * factor;
    totals.carbs_g += food.nutrientsPerBase.carbs_g * factor;
    totals.fat_g += food.nutrientsPerBase.fat_g * factor;
    totals.iron_mg += food.nutrientsPerBase.iron_mg * factor;
    totals.calcium_mg += food.nutrientsPerBase.calcium_mg * factor;
    totals.vitamin_c_mg += food.nutrientsPerBase.vitamin_c_mg * factor;
  }

  return totals;
}

export function addNutrients(target: NutrientEstimate, source: NutrientEstimate) {
  target.calories += source.calories;
  target.protein_g += source.protein_g;
  target.carbs_g += source.carbs_g;
  target.fat_g += source.fat_g;
  target.iron_mg += source.iron_mg;
  target.calcium_mg += source.calcium_mg;
  target.vitamin_c_mg += source.vitamin_c_mg;
}

export function roundNutrients(value: NutrientEstimate): NutrientEstimate {
  return {
    calories: Math.round(value.calories),
    protein_g: Number(value.protein_g.toFixed(1)),
    carbs_g: Number(value.carbs_g.toFixed(1)),
    fat_g: Number(value.fat_g.toFixed(1)),
    iron_mg: Number(value.iron_mg.toFixed(1)),
    calcium_mg: Math.round(value.calcium_mg),
    vitamin_c_mg: Number(value.vitamin_c_mg.toFixed(1))
  };
}

export function getToddlerTargets() {
  return TODDLER_TARGETS;
}


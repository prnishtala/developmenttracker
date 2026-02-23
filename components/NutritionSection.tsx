'use client';

import { MEAL_TYPES, QUANTITY_OPTIONS } from '@/lib/constants';
import { NutritionLog } from '@/lib/types';

type NutritionSectionProps = {
  logs: NutritionLog[];
  onChange: (payload: {
    mealType: string;
    hadMeal: boolean;
    quantity: string | null;
  }) => void;
};

export function NutritionSection({ logs, onChange }: NutritionSectionProps) {
  const byMeal = new Map(logs.map((log) => [log.meal_type, log]));

  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Food & Nutrition</h2>
      {MEAL_TYPES.map((meal) => {
        const current = byMeal.get(meal);
        const hadMeal = current?.had_meal ?? false;
        const quantity = current?.quantity ?? 'Normal';

        return (
          <div key={meal} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-800">{meal}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
                    hadMeal ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => onChange({ mealType: meal, hadMeal: true, quantity })}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
                    !hadMeal ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => onChange({ mealType: meal, hadMeal: false, quantity: null })}
                >
                  No
                </button>
              </div>
            </div>

            {hadMeal && (
              <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-600">
                Quantity
                <select
                  className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
                  value={quantity}
                  onChange={(event) =>
                    onChange({
                      mealType: meal,
                      hadMeal: true,
                      quantity: event.target.value
                    })
                  }
                >
                  {QUANTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        );
      })}
    </section>
  );
}

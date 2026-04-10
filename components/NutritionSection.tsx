'use client';

import { useMemo, useState } from 'react';
import { MEAL_TYPES, QUANTITY_OPTIONS } from '@/lib/constants';
import { COMMON_INDIAN_FOOD_CHIPS } from '@/lib/nutrition-ai';
import { NutritionLog } from '@/lib/types';

type NutritionSectionProps = {
  logs: NutritionLog[];
  onChange: (payload: {
    mealType: string;
    hadMeal: boolean;
    quantity: string | null;
    mealNotes: string | null;
  }) => void;
};

export function NutritionSection({ logs, onChange }: NutritionSectionProps) {
  const [customMealName, setCustomMealName] = useState('');
  const byMeal = useMemo(() => new Map(logs.map((log) => [log.meal_type, log])), [logs]);
  const extraMeals = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((log) => log.meal_type)
            .filter((mealType) => !MEAL_TYPES.includes(mealType as (typeof MEAL_TYPES)[number]))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [logs]
  );
  const mealRows = useMemo(() => [...MEAL_TYPES, ...extraMeals], [extraMeals]);

  function appendFoodChip(currentNotes: string, chip: string): string {
    const trimmed = currentNotes.trim();
    if (!trimmed) return chip;
    const normalized = trimmed.toLowerCase();
    if (normalized.includes(chip.toLowerCase())) return currentNotes;
    return `${trimmed}, ${chip}`;
  }

  function addCustomMeal() {
    const mealType = customMealName.trim();
    if (!mealType) return;
    onChange({ mealType, hadMeal: true, quantity: 'Normal', mealNotes: '' });
    setCustomMealName('');
  }

  return (
    <section className="futuristic-panel space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Food & Nutrition</h2>
        <span className="futuristic-chip">Meal notes drive insights</span>
      </div>

      <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-400/10 p-3">
        <p className="text-sm font-semibold text-cyan-50">A small note goes a long way</p>
        <p className="mt-1 text-xs leading-5 text-cyan-100/80">
          Tell us what she ate, how much, and any details you notice. AI uses this text under the hood to estimate
          calories, protein, iron, calcium, vitamin C, and more.
        </p>
      </div>

      {mealRows.map((meal) => {
        const current = byMeal.get(meal);
        const hadMeal = current?.had_meal ?? false;
        const quantity = current?.quantity ?? 'Normal';
        const mealNotes = current?.meal_notes ?? '';
        const isDefaultMeal = MEAL_TYPES.includes(meal as (typeof MEAL_TYPES)[number]);

        return (
          <div key={meal} className="rounded-[22px] border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-white">{meal}</p>
                {!isDefaultMeal && <span className="futuristic-chip">Custom</span>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`futuristic-button h-10 min-w-16 ${
                    hadMeal
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                  onClick={() => onChange({ mealType: meal, hadMeal: true, quantity, mealNotes })}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`futuristic-button h-10 min-w-16 ${
                    !hadMeal
                      ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                      : 'border border-white/10 bg-white/5 text-slate-200'
                  }`}
                  onClick={() => onChange({ mealType: meal, hadMeal: false, quantity: null, mealNotes: null })}
                >
                  No
                </button>
              </div>
            </div>

            {hadMeal && (
              <>
                <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-300">
                  Quantity
                  <select
                    className="futuristic-input h-11"
                    value={quantity}
                    onChange={(event) =>
                      onChange({
                        mealType: meal,
                        hadMeal: true,
                        quantity: event.target.value,
                        mealNotes
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

                <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-300">
                  What did baby eat and how much? (optional)
                  <textarea
                    rows={3}
                    className="min-h-[6.5rem] rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
                    value={mealNotes}
                    onChange={(event) =>
                      onChange({
                        mealType: meal,
                        hadMeal: true,
                        quantity,
                        mealNotes: event.target.value
                      })
                    }
                    placeholder="Example: 1 idli + 1/2 banana"
                  />
                </label>

                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-slate-300">Quick add common foods</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_INDIAN_FOOD_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          onChange({
                            mealType: meal,
                            hadMeal: true,
                            quantity,
                            mealNotes: appendFoodChip(mealNotes, chip)
                          })
                        }
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-400/10 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-cyan-50">Add meal on the fly</p>
          <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Ad hoc meal</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={customMealName}
            onChange={(event) => setCustomMealName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomMeal();
              }
            }}
            className="futuristic-input h-11 flex-1"
            placeholder="Type a meal like post-nap snack or curd rice"
          />
          <button
            type="button"
            onClick={addCustomMeal}
            className="futuristic-button bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950"
          >
            Add meal
          </button>
        </div>
      </div>
    </section>
  );
}

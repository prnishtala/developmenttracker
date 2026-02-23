'use client';

import { FOOD_GROUPS, SUGAR_RELATED_GROUPS } from '@/lib/constants';
import { FoodLog } from '@/lib/types';

type FoodSelectorProps = {
  foods: FoodLog[];
  onChange: (payload: {
    foodGroup: string;
    selected: boolean;
    newFood: boolean;
    packaged: boolean;
  }) => void;
};

export function FoodSelector({ foods, onChange }: FoodSelectorProps) {
  const current = new Map(foods.map((food) => [food.food_group, food]));

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Food Tracking</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FOOD_GROUPS.map((group) => {
          const selected = current.has(group);
          const item = current.get(group);
          const showWarning = selected && !!item?.packaged && SUGAR_RELATED_GROUPS.includes(group);

          return (
            <div key={group} className="rounded-xl border border-slate-200 p-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    foodGroup: group,
                    selected: !selected,
                    newFood: item?.new_food ?? false,
                    packaged: item?.packaged ?? false
                  })
                }
                className={`h-14 w-full rounded-xl px-3 text-sm font-medium ${
                  selected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {group}
              </button>

              {selected && (
                <div className="mt-2 space-y-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={item?.new_food ?? false}
                      onChange={(event) =>
                        onChange({
                          foodGroup: group,
                          selected: true,
                          newFood: event.target.checked,
                          packaged: item?.packaged ?? false
                        })
                      }
                    />
                    New food
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={item?.packaged ?? false}
                      onChange={(event) =>
                        onChange({
                          foodGroup: group,
                          selected: true,
                          newFood: item?.new_food ?? false,
                          packaged: event.target.checked
                        })
                      }
                    />
                    Packaged
                  </label>

                  {showWarning && (
                    <p className="rounded-lg bg-amber-100 p-2 font-medium text-amber-900">
                      Packaged sugary foods should be limited.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

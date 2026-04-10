'use client';

import { BATH_DURATION_OPTIONS, VITAMIN_C_FRUITS } from '@/lib/constants';
import { CareLog } from '@/lib/types';

type CareSectionProps = {
  log: CareLog;
  onChange: (payload: Partial<CareLog>) => void;
};

export function CareSection({ log, onChange }: CareSectionProps) {
  const medicineGiven = log.iron_drops || log.multivitamin_drops;
  const fruitValue = log.vitamin_c_fruit ?? '';
  const selectedVitaminCFruit = VITAMIN_C_FRUITS.includes(fruitValue as (typeof VITAMIN_C_FRUITS)[number])
    ? fruitValue
    : '';
  const customVitaminCFruit = selectedVitaminCFruit ? '' : fruitValue;

  return (
    <section className="futuristic-panel space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Medicines & Care</h2>
        <span className="futuristic-chip">Support log</span>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-white">Iron drops</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ iron_drops: true })}
            className={`futuristic-button h-10 min-w-16 ${
              log.iron_drops
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ iron_drops: false })}
            className={`futuristic-button h-10 min-w-16 ${
              !log.iron_drops
                ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            No
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-white">Multivitamin drops</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ multivitamin_drops: true })}
            className={`futuristic-button h-10 min-w-16 ${
              log.multivitamin_drops
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ multivitamin_drops: false })}
            className={`futuristic-button h-10 min-w-16 ${
              !log.multivitamin_drops
                ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {medicineGiven && (
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">Vitamin C fruit given with drops?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ vitamin_c_given: true })}
              className={`futuristic-button h-10 min-w-16 ${
                log.vitamin_c_given
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange({ vitamin_c_given: false, vitamin_c_fruit: null })}
              className={`futuristic-button h-10 min-w-16 ${
                !log.vitamin_c_given
                  ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              No
            </button>
          </div>

          {log.vitamin_c_given && (
            <label className="mt-3 flex flex-col gap-2 text-xs font-medium text-slate-300">
              Which fruit?
              <select
                value={selectedVitaminCFruit}
                onChange={(event) => onChange({ vitamin_c_fruit: event.target.value })}
                className="futuristic-input h-11"
              >
                <option value="">Select fruit</option>
                {VITAMIN_C_FRUITS.map((fruit) => (
                  <option key={fruit} value={fruit}>
                    {fruit}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={customVitaminCFruit}
                onChange={(event) => onChange({ vitamin_c_fruit: event.target.value })}
                className="futuristic-input h-11"
                placeholder="Or type another fruit"
              />
            </label>
          )}
        </div>
      )}

      <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-white">Bath given?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ bath_completed: true })}
            className={`futuristic-button h-10 min-w-16 ${
              log.bath_completed
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ bath_completed: false, bath_duration: null })}
            className={`futuristic-button h-10 min-w-16 ${
              !log.bath_completed
                ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-200'
            }`}
          >
            No
          </button>
        </div>

        {log.bath_completed && (
          <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-300">
            Bath time window
            <select
              value={log.bath_duration ?? ''}
              onChange={(event) => onChange({ bath_duration: event.target.value })}
              className="futuristic-input h-11"
            >
              <option value="">Select duration</option>
              {BATH_DURATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}

'use client';

import { BATH_DURATION_OPTIONS, VITAMIN_C_FRUITS } from '@/lib/constants';
import { CareLog } from '@/lib/types';

type CareSectionProps = {
  log: CareLog;
  onChange: (payload: Partial<CareLog>) => void;
};

export function CareSection({ log, onChange }: CareSectionProps) {
  const medicineGiven = log.iron_drops || log.multivitamin_drops;

  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Medicines & Care</h2>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-800">Iron drops</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ iron_drops: true })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              log.iron_drops ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ iron_drops: false })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              !log.iron_drops ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            No
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-800">Multivitamin drops</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ multivitamin_drops: true })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              log.multivitamin_drops ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ multivitamin_drops: false })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              !log.multivitamin_drops ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {medicineGiven && (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-800">Vitamin C fruit given with drops?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ vitamin_c_given: true })}
              className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
                log.vitamin_c_given ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange({ vitamin_c_given: false, vitamin_c_fruit: null })}
              className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
                !log.vitamin_c_given ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              No
            </button>
          </div>

          {log.vitamin_c_given && (
            <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-600">
              Which fruit?
              <select
                value={log.vitamin_c_fruit ?? ''}
                onChange={(event) => onChange({ vitamin_c_fruit: event.target.value })}
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
              >
                <option value="">Select fruit</option>
                {VITAMIN_C_FRUITS.map((fruit) => (
                  <option key={fruit} value={fruit}>
                    {fruit}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-800">Bath given?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ bath_completed: true })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              log.bath_completed ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ bath_completed: false, bath_duration: null })}
            className={`h-10 min-w-16 rounded-xl text-sm font-semibold ${
              !log.bath_completed ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            No
          </button>
        </div>

        {log.bath_completed && (
          <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-600">
            Bath time window
            <select
              value={log.bath_duration ?? ''}
              onChange={(event) => onChange({ bath_duration: event.target.value })}
              className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
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

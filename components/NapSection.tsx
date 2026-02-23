'use client';

import { getTimeOptions, NAP_DURATION_OPTIONS } from '@/lib/constants';
import { NapLog } from '@/lib/types';

type NapSectionProps = {
  naps: NapLog[];
  onAdd: () => void;
  onUpdate: (napId: string, changes: Partial<NapLog>) => void;
  onDelete: (napId: string) => void;
};

const TIME_OPTIONS = getTimeOptions();

export function NapSection({ naps, onAdd, onUpdate, onDelete }: NapSectionProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Nap Times</h2>
        <button
          type="button"
          onClick={onAdd}
          className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white"
        >
          + Add nap
        </button>
      </div>

      {naps.length === 0 && <p className="text-sm text-slate-600">No naps added yet for today.</p>}

      {naps.map((nap) => (
        <div key={nap.id} className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Nap</p>
            <button
              type="button"
              onClick={() => onDelete(nap.id)}
              className="h-9 rounded-xl bg-rose-100 px-3 text-xs font-semibold text-rose-700"
            >
              Remove
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Start time
            <select
              value={nap.start_time}
              onChange={(event) => onUpdate(nap.id, { start_time: event.target.value })}
              className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdate(nap.id, { entry_mode: 'end_time', duration_minutes: null })}
              className={`h-10 rounded-xl text-sm font-semibold ${
                nap.entry_mode === 'end_time' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              End time
            </button>
            <button
              type="button"
              onClick={() => onUpdate(nap.id, { entry_mode: 'duration', end_time: null })}
              className={`h-10 rounded-xl text-sm font-semibold ${
                nap.entry_mode === 'duration' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Duration
            </button>
          </div>

          {nap.entry_mode === 'end_time' ? (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              End time
              <select
                value={nap.end_time ?? '12:30'}
                onChange={(event) => onUpdate(nap.id, { end_time: event.target.value, duration_minutes: null })}
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Duration (mins)
              <select
                value={nap.duration_minutes ?? 60}
                onChange={(event) =>
                  onUpdate(nap.id, {
                    duration_minutes: Number(event.target.value),
                    end_time: null
                  })
                }
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
              >
                {NAP_DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      ))}
    </section>
  );
}

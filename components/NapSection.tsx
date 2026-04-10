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
    <section className="futuristic-panel space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Nap Times</h2>
        <button
          type="button"
          onClick={onAdd}
          className="futuristic-button bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950"
        >
          + Add nap
        </button>
      </div>

      {naps.length === 0 && <p className="text-sm text-slate-300">No naps added yet for today.</p>}

      {naps.map((nap) => (
        <div key={nap.id} className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Nap</p>
            <button
              type="button"
              onClick={() => onDelete(nap.id)}
              className="futuristic-button h-9 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 text-xs font-semibold text-rose-100 hover:bg-rose-400/15"
            >
              Remove
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
            Start time
            <select
              value={nap.start_time}
              onChange={(event) => onUpdate(nap.id, { start_time: event.target.value })}
              className="futuristic-input h-11"
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
              className={`futuristic-button h-10 rounded-2xl text-sm font-semibold ${
                nap.entry_mode === 'end_time'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              End time
            </button>
            <button
              type="button"
              onClick={() => onUpdate(nap.id, { entry_mode: 'duration', end_time: null })}
              className={`futuristic-button h-10 rounded-2xl text-sm font-semibold ${
                nap.entry_mode === 'duration'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200'
              }`}
            >
              Duration
            </button>
          </div>

          {nap.entry_mode === 'end_time' ? (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
              End time
              <select
                value={nap.end_time ?? '12:30'}
                onChange={(event) => onUpdate(nap.id, { end_time: event.target.value, duration_minutes: null })}
                className="futuristic-input h-11"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
              Duration (mins)
              <select
                value={nap.duration_minutes ?? 60}
                onChange={(event) =>
                  onUpdate(nap.id, {
                    duration_minutes: Number(event.target.value),
                    end_time: null
                  })
                }
                className="futuristic-input h-11"
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

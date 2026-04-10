'use client';

import { DURATION_OPTIONS, RATING_OPTIONS } from '@/lib/constants';
import { ActivityWithLog } from '@/lib/types';

type ActivityCardProps = {
  activity: ActivityWithLog;
  onChange: (payload: {
    activityId: string;
    completed?: boolean;
    rating?: string;
    duration?: string;
  }) => void;
};

export function ActivityCard({ activity, onChange }: ActivityCardProps) {
  const completed = activity.log?.completed ?? false;
  const rating = activity.log?.rating ?? '';
  const duration = activity.log?.duration ?? '';

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">{activity.name}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{activity.category}</p>
        </div>
        <button
          type="button"
          aria-label={`Mark ${activity.name} complete`}
          onClick={() => onChange({ activityId: activity.id, completed: !completed })}
          className={`h-10 min-w-10 rounded-2xl border text-lg font-semibold transition ${
            completed
              ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,0.25)]'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {completed ? '\u2713' : ''}
        </button>
      </div>
      <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-slate-300">
        {activity.how_to ?? 'Guide baby through this activity with gentle support and positive encouragement.'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Rating
          <select
            value={rating}
            onChange={(event) => onChange({ activityId: activity.id, rating: event.target.value })}
            className="futuristic-input h-11"
          >
            <option value="">Select</option>
            {RATING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Duration
          <select
            value={duration}
            onChange={(event) => onChange({ activityId: activity.id, duration: event.target.value })}
            className="futuristic-input h-11"
          >
            <option value="">Select</option>
            {DURATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

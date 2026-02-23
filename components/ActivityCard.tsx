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
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-800">{activity.name}</h3>
        <button
          type="button"
          aria-label={`Mark ${activity.name} complete`}
          onClick={() => onChange({ activityId: activity.id, completed: !completed })}
          className={`h-10 min-w-10 rounded-xl border-2 text-lg font-semibold transition ${
            completed
              ? 'border-brand-600 bg-brand-500 text-white'
              : 'border-slate-300 bg-white text-slate-500'
          }`}
        >
          {completed ? '?' : ''}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Rating
          <select
            value={rating}
            onChange={(event) => onChange({ activityId: activity.id, rating: event.target.value })}
            className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
          >
            <option value="">Select</option>
            {RATING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Duration
          <select
            value={duration}
            onChange={(event) => onChange({ activityId: activity.id, duration: event.target.value })}
            className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
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

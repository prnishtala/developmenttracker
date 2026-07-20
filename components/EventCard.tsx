'use client';

import { format, parseISO } from 'date-fns';
import { ToddlerEventWithFavorite } from '@/lib/types';

type EventCardProps = {
  event: ToddlerEventWithFavorite;
  onToggleFavorite: (event: ToddlerEventWithFavorite, favorited: boolean) => void;
};

function formatWhen(event: ToddlerEventWithFavorite): string {
  if (!event.event_date) {
    return 'Open anytime · ongoing';
  }
  let label = format(parseISO(event.event_date), 'EEE, MMM d');
  if (event.start_time) {
    label += ` · ${event.start_time}`;
    if (event.end_time) label += `–${event.end_time}`;
  }
  return label;
}

function ageLabel(event: ToddlerEventWithFavorite): string | null {
  const { min_age_months, max_age_months } = event;
  if (min_age_months === null && max_age_months === null) return null;
  const min = min_age_months ?? 0;
  const max = max_age_months ?? 60;
  return `${min}–${max} mo`;
}

export function EventCard({ event, onToggleFavorite }: EventCardProps) {
  const favorited = event.favorited;
  const settingLabel = event.setting === 'both' ? 'Indoor/Outdoor' : event.setting === 'indoor' ? 'Indoor' : 'Outdoor';
  const age = ageLabel(event);

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">{event.title}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {formatWhen(event)}
          </p>
          <p className="text-xs text-slate-300">
            {[event.venue_name, event.city].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          aria-label={favorited ? `Remove ${event.title} from favorites` : `Save ${event.title}`}
          aria-pressed={favorited}
          onClick={() => onToggleFavorite(event, !favorited)}
          className={`h-10 min-w-10 rounded-2xl border text-lg font-semibold transition ${
            favorited
              ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,0.25)]'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>

      {event.description && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-slate-300">
          {event.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span
          className={`rounded-full border px-2 py-1 font-semibold ${
            event.is_free
              ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200'
              : 'border-amber-300/30 bg-amber-400/10 text-amber-200'
          }`}
        >
          {event.is_free ? 'Free' : event.cost_text || 'Paid'}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{settingLabel}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{event.category}</span>
        {age && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{age}</span>}
        <span
          className={`rounded-full border px-2 py-1 font-medium ${
            event.verified
              ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
              : 'border-rose-300/30 bg-rose-400/10 text-rose-200'
          }`}
        >
          {event.verified ? 'Verified' : 'Unverified — confirm'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="futuristic-button h-9 border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
        >
          View details ↗
        </a>
        {event.booking_url && (
          <a
            href={event.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="futuristic-button h-9 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950"
          >
            Register ↗
          </a>
        )}
      </div>
    </div>
  );
}

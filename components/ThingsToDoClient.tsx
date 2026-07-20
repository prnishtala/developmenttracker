'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, nextSaturday, nextSunday, parseISO } from 'date-fns';
import { AGE_BANDS, CITY_OPTIONS, EVENT_CATEGORIES } from '@/lib/constants';
import { ToddlerEventWithFavorite } from '@/lib/types';
import { EventCard } from '@/components/EventCard';

type DateScope = 'This weekend' | 'This week' | 'Next 4 weeks';
type CostFilter = 'Free' | 'Paid' | 'All';
type SettingFilter = 'All' | 'indoor' | 'outdoor';

type ThingsToDoClientProps = {
  today: string;
  initialEvents: ToddlerEventWithFavorite[];
};

function SegButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-2xl px-3 text-xs font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,0.25)]'
          : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function ThingsToDoClient({ today, initialEvents }: ThingsToDoClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [dateScope, setDateScope] = useState<DateScope>('This weekend');
  const [cost, setCost] = useState<CostFilter>('Free');
  const [setting, setSetting] = useState<SettingFilter>('All');
  const [cities, setCities] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [ageBandIndex, setAgeBandIndex] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const now = useMemo(() => parseISO(today), [today]);
  const saturdayStr = useMemo(() => format(nextSaturday(now), 'yyyy-MM-dd'), [now]);
  const sundayStr = useMemo(() => format(nextSunday(now), 'yyyy-MM-dd'), [now]);

  const toggleFavorite = useCallback(
    async (event: ToddlerEventWithFavorite, favorited: boolean) => {
      const previous = events;
      setEvents((current) => current.map((item) => (item.id === event.id ? { ...item, favorited } : item)));
      try {
        const res = await fetch('/api/event-favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: event.id, favorited })
        });
        if (!res.ok) setEvents(previous);
      } catch {
        setEvents(previous);
      }
    },
    [events]
  );

  const toggleInSet = (value: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const band = AGE_BANDS[ageBandIndex];
    return events.filter((event) => {
      // Date scope (attractions with no date always pass).
      if (event.event_date) {
        if (dateScope === 'This weekend' && !(event.event_date === saturdayStr || event.event_date === sundayStr)) {
          return false;
        }
        if (dateScope === 'This week' && event.event_date > sundayStr) {
          return false;
        }
      }

      if (cost === 'Free' && !event.is_free) return false;
      if (cost === 'Paid' && event.is_free) return false;

      if (setting !== 'All' && event.setting !== setting && event.setting !== 'both') return false;

      if (cities.size > 0 && !cities.has(event.city)) return false;
      if (categories.size > 0 && !categories.has(event.category)) return false;

      const eMin = event.min_age_months ?? 0;
      const eMax = event.max_age_months ?? 240;
      if (!(eMin <= band.maxMonths && eMax >= band.minMonths)) return false;

      if (favoritesOnly && !event.favorited) return false;

      return true;
    });
  }, [events, dateScope, cost, setting, cities, categories, ageBandIndex, favoritesOnly, saturdayStr, sundayStr]);

  const datedGroups = useMemo(() => {
    const dated = filtered
      .filter((event) => event.event_date)
      .sort((a, b) => (a.event_date! < b.event_date! ? -1 : a.event_date! > b.event_date! ? 1 : 0));
    const groups = new Map<string, ToddlerEventWithFavorite[]>();
    for (const event of dated) {
      const key = event.event_date as string;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const ongoing = useMemo(() => filtered.filter((event) => !event.event_date), [filtered]);

  return (
    <div className="futuristic-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="futuristic-panel space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white">Things To Do</h1>
          <span className="futuristic-chip">DFW · next 4 weeks</span>
        </div>
        <p className="text-xs leading-5 text-slate-300">
          Toddler-friendly outings around Dallas–Fort Worth. Times change — always confirm on the official page before
          you go. Items marked <span className="text-rose-200">Unverified</span> are AI suggestions to double-check.
        </p>

        <div className="flex flex-wrap gap-2">
          {(['This weekend', 'This week', 'Next 4 weeks'] as DateScope[]).map((scope) => (
            <SegButton key={scope} active={dateScope === scope} onClick={() => setDateScope(scope)}>
              {scope}
            </SegButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['Free', 'Paid', 'All'] as CostFilter[]).map((option) => (
            <SegButton key={option} active={cost === option} onClick={() => setCost(option)}>
              {option}
            </SegButton>
          ))}
          <span className="mx-1 self-center text-white/20">|</span>
          {(['All', 'indoor', 'outdoor'] as SettingFilter[]).map((option) => (
            <SegButton key={option} active={setting === option} onClick={() => setSetting(option)}>
              {option === 'All' ? 'Any setting' : option === 'indoor' ? 'Indoor' : 'Outdoor'}
            </SegButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {AGE_BANDS.map((band, index) => (
            <SegButton key={band.label} active={ageBandIndex === index} onClick={() => setAgeBandIndex(index)}>
              {band.label}
            </SegButton>
          ))}
          <span className="mx-1 self-center text-white/20">|</span>
          <SegButton active={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}>
            ★ Favorites
          </SegButton>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          {CITY_OPTIONS.map((city) => (
            <Chip key={city} active={cities.has(city)} onClick={() => toggleInSet(city, setCities)}>
              {city}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((category) => (
            <Chip key={category} active={categories.has(category)} onClick={() => toggleInSet(category, setCategories)}>
              {category}
            </Chip>
          ))}
        </div>
      </section>

      {filtered.length === 0 && (
        <section className="futuristic-panel p-6 text-center text-sm text-slate-300">
          Nothing matches these filters yet. Try widening the date range, cost, or clearing city/category chips. New
          events are pulled in automatically every morning.
        </section>
      )}

      {datedGroups.map(([date, groupEvents]) => (
        <section key={date} className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {format(parseISO(date), 'EEEE, MMM d')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupEvents.map((event) => (
              <EventCard key={event.id} event={event} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      ))}

      {ongoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Open anytime</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ongoing.map((event) => (
              <EventCard key={event.id} event={event} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityCard } from '@/components/ActivityCard';
import { CareSection } from '@/components/CareSection';
import { NapSection } from '@/components/NapSection';
import { NutritionSection } from '@/components/NutritionSection';
import { FALLBACK_TIME_ZONE, getDateInTimeZone, isDateWithinBackRange } from '@/lib/date';
import { ActivityWithLog, CareLog, HomeInsights, NapLog, NutritionLog } from '@/lib/types';

type HomeClientProps = {
  date: string;
  minDate: string;
  maxDate: string;
  timeZone: string;
  initialActivities: ActivityWithLog[];
  initialNutritionLogs: NutritionLog[];
  initialCareLog: CareLog | null;
  initialNapLogs: NapLog[];
  insights: HomeInsights;
};

type TabKey = 'development' | 'nutrition' | 'care' | 'naps';

const TAB_LABELS: Record<TabKey, string> = {
  development: 'Development Activities',
  nutrition: 'Food & Nutrition',
  care: 'Medicines & Care',
  naps: 'Nap Times'
};

function defaultCareLog(date: string): CareLog {
  return {
    id: '',
    date,
    iron_drops: false,
    multivitamin_drops: false,
    vitamin_c_given: false,
    vitamin_c_fruit: null,
    bath_completed: false,
    bath_duration: null
  };
}

function isWeekend(date: string): boolean {
  const day = parseISO(date).getDay();
  return day === 0 || day === 6;
}

export function HomeClient({
  date,
  minDate,
  maxDate,
  timeZone,
  initialActivities,
  initialNutritionLogs,
  initialCareLog,
  initialNapLogs,
  insights
}: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('development');
  const [activities, setActivities] = useState(initialActivities);
  const [nutritionLogs, setNutritionLogs] = useState(initialNutritionLogs);
  const [careLog, setCareLog] = useState(initialCareLog ?? defaultCareLog(date));
  const [napLogs, setNapLogs] = useState(initialNapLogs);
  const [clientTimeZone, setClientTimeZone] = useState(timeZone);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActivities(initialActivities);
    setNutritionLogs(initialNutritionLogs);
    setCareLog(initialCareLog ?? defaultCareLog(date));
    setNapLogs(initialNapLogs);
  }, [date, initialActivities, initialCareLog, initialNapLogs, initialNutritionLogs]);

  useEffect(() => {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE;
    setClientTimeZone(detectedTimeZone);

    if (detectedTimeZone === timeZone) return;

    const todayInDetectedZone = getDateInTimeZone(new Date(), detectedTimeZone);
    const nextDate = isDateWithinBackRange(date, todayInDetectedZone, 7) ? date : todayInDetectedZone;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tz', detectedTimeZone);
    params.set('date', nextDate);

    router.replace(`/?${params.toString()}`);
  }, [date, router, searchParams, timeZone]);

  const completionPercentage = useMemo(() => {
    if (!activities.length) return 0;
    const completed = activities.filter((activity) => activity.log?.completed).length;
    return Math.round((completed / activities.length) * 100);
  }, [activities]);

  const groupedActivities = useMemo(() => {
    return activities.reduce<Record<string, ActivityWithLog[]>>((acc, activity) => {
      acc[activity.category] = acc[activity.category] ?? [];
      acc[activity.category].push(activity);
      return acc;
    }, {});
  }, [activities]);

  async function upsertDailyLog(payload: {
    activityId: string;
    completed?: boolean;
    rating?: string;
    duration?: string;
  }) {
    const currentActivity = activities.find((activity) => activity.id === payload.activityId);
    if (!currentActivity) return;

    const mergedLog = {
      completed: payload.completed ?? currentActivity.log?.completed ?? false,
      rating: payload.rating ?? currentActivity.log?.rating ?? null,
      duration: payload.duration ?? currentActivity.log?.duration ?? null
    };

    const previous = activities;

    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== payload.activityId) return activity;
        const nextLog = {
          id: activity.log?.id ?? '',
          date,
          activity_id: activity.id,
          completed: mergedLog.completed,
          rating: mergedLog.rating,
          duration: mergedLog.duration
        };
        return { ...activity, log: nextLog };
      })
    );

    startTransition(async () => {
      try {
        const res = await fetch('/api/daily-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            activityId: payload.activityId,
            completed: mergedLog.completed,
            rating: mergedLog.rating,
            duration: mergedLog.duration
          })
        });
        if (!res.ok) throw new Error('Unable to save activity log');
      } catch {
        setActivities(previous);
      }
    });
  }

  function onDateChange(nextDate: string) {
    if (!isDateWithinBackRange(nextDate, maxDate, 7)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('date', nextDate);
    params.set('tz', clientTimeZone || FALLBACK_TIME_ZONE);
    router.push(`/?${params.toString()}`);
  }

  async function upsertNutritionLog(payload: {
    mealType: string;
    hadMeal: boolean;
    quantity: string | null;
    mealNotes: string | null;
  }) {
    const previous = nutritionLogs;

    setNutritionLogs((current) => {
      const existing = current.find((item) => item.meal_type === payload.mealType);
      if (!existing) {
        return [
          ...current,
          {
            id: '',
            date,
            meal_type: payload.mealType,
            had_meal: payload.hadMeal,
            quantity: payload.quantity,
            meal_notes: payload.hadMeal ? payload.mealNotes : null
          }
        ];
      }
      return current.map((item) =>
        item.meal_type === payload.mealType
          ? {
              ...item,
              had_meal: payload.hadMeal,
              quantity: payload.quantity,
              meal_notes: payload.hadMeal ? payload.mealNotes : null
            }
          : item
      );
    });

    startTransition(async () => {
      try {
        const res = await fetch('/api/nutrition-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ...payload })
        });
        if (!res.ok) throw new Error('Unable to save nutrition log');
      } catch {
        setNutritionLogs(previous);
      }
    });
  }

  async function upsertCareLog(changes: Partial<CareLog>) {
    const previous = careLog;
    const next = { ...careLog, ...changes };

    if (!next.iron_drops && !next.multivitamin_drops) {
      next.vitamin_c_given = false;
      next.vitamin_c_fruit = null;
    }

    setCareLog(next);

    startTransition(async () => {
      try {
        const res = await fetch('/api/care-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            ironDrops: next.iron_drops,
            multivitaminDrops: next.multivitamin_drops,
            vitaminCGiven: next.vitamin_c_given,
            vitaminCFruit: next.vitamin_c_fruit,
            bathCompleted: next.bath_completed,
            bathDuration: next.bath_duration
          })
        });
        if (!res.ok) throw new Error('Unable to save care log');
      } catch {
        setCareLog(previous);
      }
    });
  }

  async function addNap() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/nap-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            date,
            startTime: '12:00',
            entryMode: 'duration',
            durationMinutes: 60,
            endTime: null
          })
        });
        if (!res.ok) throw new Error('Unable to create nap');
        const payload = await res.json();
        const nap = payload.nap as NapLog;
        setNapLogs((current) => [
          ...current,
          {
            ...nap,
            start_time: nap.start_time.slice(0, 5),
            end_time: nap.end_time ? nap.end_time.slice(0, 5) : null
          }
        ]);
      } catch {
        // no-op
      }
    });
  }

  async function updateNap(napId: string, changes: Partial<NapLog>) {
    const previous = napLogs;

    setNapLogs((current) => current.map((nap) => (nap.id === napId ? { ...nap, ...changes } : nap)));

    const updatedNap = napLogs.find((nap) => nap.id === napId);
    if (!updatedNap) return;

    const merged = { ...updatedNap, ...changes };

    startTransition(async () => {
      try {
        const res = await fetch('/api/nap-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: napId,
            date,
            startTime: merged.start_time,
            endTime: merged.entry_mode === 'end_time' ? merged.end_time : null,
            durationMinutes: merged.entry_mode === 'duration' ? merged.duration_minutes : null,
            entryMode: merged.entry_mode
          })
        });
        if (!res.ok) throw new Error('Unable to update nap');
      } catch {
        setNapLogs(previous);
      }
    });
  }

  async function deleteNap(napId: string) {
    const previous = napLogs;
    setNapLogs((current) => current.filter((nap) => nap.id !== napId));

    startTransition(async () => {
      try {
        const res = await fetch('/api/nap-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: napId })
        });
        if (!res.ok) throw new Error('Unable to delete nap');
      } catch {
        setNapLogs(previous);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-brand-500 p-4 text-white shadow-sm">
        <div className="absolute inset-0 bg-[url('/jungle-banner.svg')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 via-lime-800/45 to-teal-900/60" />
        <div className="relative">
          <h1 className="text-2xl font-bold">Ahana&apos;s Development Tracker</h1>
          <p className="mt-1 text-sm opacity-90">Daily checklist for {date}</p>
          <p className="text-xs opacity-80">Timezone: {clientTimeZone}</p>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/20 p-3">
            <p className="text-xs uppercase">Development completion</p>
            <p className="text-2xl font-bold">{completionPercentage}%</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <p className="text-xs uppercase">Weekly streak</p>
            <p className="text-2xl font-bold">{insights.weeklyStreak} days</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          Select Date (up to 1 week back)
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900"
          />
        </label>
      </section>

      {insights.noOutdoorFor3Days && (
        <p className="rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">
          Alert: No outdoor activity logged for 3 consecutive days.
        </p>
      )}

      {insights.lowLanguageFor3Days && (
        <p className="rounded-xl bg-rose-100 p-3 text-sm font-medium text-rose-900">
          Alert: Language activities have stayed under 15 minutes for 3 consecutive days.
        </p>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-12 rounded-xl px-3 text-sm font-semibold ${
              activeTab === tab ? 'bg-brand-500 text-white' : 'bg-white text-slate-700 shadow-sm'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </section>

      {activeTab === 'development' && (
        <section className="space-y-4">
          {isWeekend(date) && (
            <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              Weekday schedule is set for Monday to Friday. No planned development activities for weekends.
            </p>
          )}
          {Object.entries(groupedActivities).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
              <div className="space-y-2">
                {items.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} onChange={upsertDailyLog} />
                ))}
              </div>
            </div>
          ))}
          {!isWeekend(date) && activities.length === 0 && (
            <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">No activities available.</p>
          )}
        </section>
      )}

      {activeTab === 'nutrition' && <NutritionSection logs={nutritionLogs} onChange={upsertNutritionLog} />}

      {activeTab === 'care' && <CareSection log={careLog} onChange={upsertCareLog} />}

      {activeTab === 'naps' && <NapSection naps={napLogs} onAdd={addNap} onUpdate={updateNap} onDelete={deleteNap} />}

      {isPending && <p className="text-center text-xs text-slate-500">Saving...</p>}
    </div>
  );
}

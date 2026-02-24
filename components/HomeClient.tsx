'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
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

type PendingMutation = {
  id: string;
  kind: 'generic' | 'nap-create' | 'nap-update' | 'nap-delete';
  endpoint: string;
  body: Record<string, unknown>;
  tempNapId?: string;
};

const TAB_LABELS: Record<TabKey, string> = {
  development: 'Development Activities',
  nutrition: 'Food & Nutrition',
  care: 'Medicines & Care',
  naps: 'Nap Times'
};

const PENDING_MUTATIONS_KEY = 'ahana-pending-mutations-v1';

function defaultCareLog(dateValue: string): CareLog {
  return {
    id: '',
    date: dateValue,
    iron_drops: false,
    multivitamin_drops: false,
    vitamin_c_given: false,
    vitamin_c_fruit: null,
    bath_completed: false,
    bath_duration: null
  };
}

function isWeekend(dateValue: string): boolean {
  const day = parseISO(dateValue).getDay();
  return day === 0 || day === 6;
}

function readPendingMutations(): PendingMutation[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(PENDING_MUTATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingMutation[]) : [];
  } catch {
    return [];
  }
}

function writePendingMutations(items: PendingMutation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(items));
}

function enqueuePendingMutation(item: PendingMutation) {
  const current = readPendingMutations();
  current.push(item);
  writePendingMutations(current);
  return current.length;
}

function isTempNapId(napId: string) {
  return napId.startsWith('temp-');
}

function toDisplayNap(nap: NapLog): NapLog {
  return {
    ...nap,
    start_time: nap.start_time.slice(0, 5),
    end_time: nap.end_time ? nap.end_time.slice(0, 5) : null
  };
}

function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
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
  const syncingRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabKey>('development');
  const [activities, setActivities] = useState(initialActivities);
  const [nutritionLogs, setNutritionLogs] = useState(initialNutritionLogs);
  const [careLog, setCareLog] = useState(initialCareLog ?? defaultCareLog(date));
  const [napLogs, setNapLogs] = useState(initialNapLogs);
  const [clientTimeZone, setClientTimeZone] = useState(timeZone);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'enabled' | 'blocked' | 'unsupported' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const syncPendingMutations = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof window === 'undefined' || !navigator.onLine) return;

    syncingRef.current = true;
    let queue = readPendingMutations();

    try {
      while (queue.length > 0) {
        const item = queue[0];
        try {
          const res = await fetch(item.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.body)
          });

          if (!res.ok) {
            queue = queue.slice(1);
            writePendingMutations(queue);
            continue;
          }

          if (item.kind === 'nap-create') {
            const payload = (await res.json()) as { nap?: NapLog };
            if (item.tempNapId && payload.nap) {
              const syncedNap = toDisplayNap(payload.nap);
              setNapLogs((current) => current.map((nap) => (nap.id === item.tempNapId ? syncedNap : nap)));
            }
          }

          queue = queue.slice(1);
          writePendingMutations(queue);
          setPendingSyncCount(queue.length);
        } catch {
          setIsOffline(true);
          break;
        }
      }
    } finally {
      syncingRef.current = false;
      setPendingSyncCount(readPendingMutations().length);
    }
  }, []);

  useEffect(() => {
    setActivities(initialActivities);
    setNutritionLogs(initialNutritionLogs);
    setCareLog(initialCareLog ?? defaultCareLog(date));
    setNapLogs(initialNapLogs);
  }, [date, initialActivities, initialCareLog, initialNapLogs, initialNutritionLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPendingSyncCount(readPendingMutations().length);
    setIsOffline(!navigator.onLine);

    const onOnline = () => {
      setIsOffline(false);
      syncPendingMutations();
    };
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    syncPendingMutations();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncPendingMutations]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  useEffect(() => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      setPushStatus('enabled');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('blocked');
      return;
    }
    setPushStatus('idle');
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // no-op
    });
  }, []);

  function onDateChange(nextDate: string) {
    if (!isDateWithinBackRange(nextDate, maxDate, 7)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('date', nextDate);
    params.set('tz', clientTimeZone || FALLBACK_TIME_ZONE);
    router.push(`/?${params.toString()}`);
  }

  async function sendMutationOrQueue(args: {
    mutation: PendingMutation;
    onServerError?: () => void;
    onSuccess?: (payload?: unknown) => void;
  }) {
    try {
      const res = await fetch(args.mutation.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args.mutation.body)
      });

      if (!res.ok) {
        args.onServerError?.();
        return;
      }

      let payload: unknown = undefined;
      try {
        payload = await res.json();
      } catch {
        payload = undefined;
      }
      args.onSuccess?.(payload);
    } catch {
      const count = enqueuePendingMutation(args.mutation);
      setPendingSyncCount(count);
      setIsOffline(true);
    }
  }

  async function enablePushNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      setPushMessage('Push notifications are not supported on this device/browser.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setPushStatus('error');
      setPushMessage('Push key is missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setPushStatus(permission === 'denied' ? 'blocked' : 'error');
      setPushMessage('Notification permission was not granted.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(publicKey) as BufferSource
        }));

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE;
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, timezone })
      });

      if (!res.ok) {
        setPushStatus('error');
        setPushMessage('Could not save push subscription on server.');
        return;
      }

      setPushStatus('enabled');
      setPushMessage('Push reminders enabled.');
    } catch {
      setPushStatus('error');
      setPushMessage('Push subscription failed.');
    }
  }

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
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'generic',
          endpoint: '/api/daily-log',
          body: {
            date,
            activityId: payload.activityId,
            completed: mergedLog.completed,
            rating: mergedLog.rating,
            duration: mergedLog.duration
          }
        },
        onServerError: () => setActivities(previous)
      });
    });
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
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'generic',
          endpoint: '/api/nutrition-log',
          body: { date, ...payload }
        },
        onServerError: () => setNutritionLogs(previous)
      });
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
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'generic',
          endpoint: '/api/care-log',
          body: {
            date,
            ironDrops: next.iron_drops,
            multivitaminDrops: next.multivitamin_drops,
            vitaminCGiven: next.vitamin_c_given,
            vitaminCFruit: next.vitamin_c_fruit,
            bathCompleted: next.bath_completed,
            bathDuration: next.bath_duration
          }
        },
        onServerError: () => setCareLog(previous)
      });
    });
  }

  function updatePendingTempNap(tempNapId: string, nextNap: NapLog) {
    const queue = readPendingMutations();
    const index = queue.findIndex((item) => item.kind === 'nap-create' && item.tempNapId === tempNapId);
    if (index === -1) return;

    queue[index] = {
      ...queue[index],
      body: {
        action: 'create',
        date: nextNap.date,
        startTime: nextNap.start_time,
        endTime: nextNap.entry_mode === 'end_time' ? nextNap.end_time : null,
        durationMinutes: nextNap.entry_mode === 'duration' ? nextNap.duration_minutes : null,
        entryMode: nextNap.entry_mode
      }
    };
    writePendingMutations(queue);
  }

  function removePendingTempNap(tempNapId: string) {
    const queue = readPendingMutations().filter(
      (item) => !(item.kind === 'nap-create' && item.tempNapId === tempNapId)
    );
    writePendingMutations(queue);
    setPendingSyncCount(queue.length);
  }

  async function addNap() {
    const tempNapId = `temp-${Date.now()}`;
    const tempNap: NapLog = {
      id: tempNapId,
      date,
      start_time: '12:00',
      end_time: null,
      duration_minutes: 60,
      entry_mode: 'duration'
    };

    setNapLogs((current) => [...current, tempNap]);

    startTransition(async () => {
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'nap-create',
          endpoint: '/api/nap-log',
          body: {
            action: 'create',
            date,
            startTime: '12:00',
            entryMode: 'duration',
            durationMinutes: 60,
            endTime: null
          },
          tempNapId
        },
        onServerError: () => setNapLogs((current) => current.filter((nap) => nap.id !== tempNapId)),
        onSuccess: (payload) => {
          const response = payload as { nap?: NapLog };
          if (!response?.nap) return;
          const syncedNap = toDisplayNap(response.nap);
          setNapLogs((current) => current.map((nap) => (nap.id === tempNapId ? syncedNap : nap)));
        }
      });
    });
  }

  async function updateNap(napId: string, changes: Partial<NapLog>) {
    const previous = napLogs;
    const currentNap = napLogs.find((nap) => nap.id === napId);
    if (!currentNap) return;

    const merged = { ...currentNap, ...changes };
    setNapLogs((current) => current.map((nap) => (nap.id === napId ? merged : nap)));

    if (isTempNapId(napId)) {
      updatePendingTempNap(napId, merged);
      return;
    }

    startTransition(async () => {
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'nap-update',
          endpoint: '/api/nap-log',
          body: {
            action: 'update',
            id: napId,
            date,
            startTime: merged.start_time,
            endTime: merged.entry_mode === 'end_time' ? merged.end_time : null,
            durationMinutes: merged.entry_mode === 'duration' ? merged.duration_minutes : null,
            entryMode: merged.entry_mode
          }
        },
        onServerError: () => setNapLogs(previous)
      });
    });
  }

  async function deleteNap(napId: string) {
    const previous = napLogs;
    setNapLogs((current) => current.filter((nap) => nap.id !== napId));

    if (isTempNapId(napId)) {
      removePendingTempNap(napId);
      return;
    }

    startTransition(async () => {
      await sendMutationOrQueue({
        mutation: {
          id: crypto.randomUUID(),
          kind: 'nap-delete',
          endpoint: '/api/nap-log',
          body: { action: 'delete', id: napId }
        },
        onServerError: () => setNapLogs(previous)
      });
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
          {pendingSyncCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-amber-100">
              {pendingSyncCount} offline updates pending sync.
            </p>
          )}
          {isOffline && <p className="text-xs font-semibold text-amber-100">You are offline. Changes will sync later.</p>}
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
        <div className="relative mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={enablePushNotifications}
            className="rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30"
          >
            {pushStatus === 'enabled' ? 'Push reminders enabled' : 'Enable push reminders'}
          </button>
          {pushMessage && <p className="self-center text-xs text-emerald-100">{pushMessage}</p>}
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

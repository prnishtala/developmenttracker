'use client';

import { useMemo, useState, useTransition } from 'react';
import { ActivityCard } from '@/components/ActivityCard';
import { FoodSelector } from '@/components/FoodSelector';
import { ActivityWithLog, FoodLog, HomeInsights } from '@/lib/types';

type HomeClientProps = {
  date: string;
  initialActivities: ActivityWithLog[];
  initialFoods: FoodLog[];
  insights: HomeInsights;
};

export function HomeClient({ date, initialActivities, initialFoods, insights }: HomeClientProps) {
  const [activities, setActivities] = useState(initialActivities);
  const [foods, setFoods] = useState(initialFoods);
  const [isPending, startTransition] = useTransition();
  const completionPercentage = useMemo(() => {
    if (!activities.length) return 0;
    const completed = activities.filter((activity) => activity.log?.completed).length;
    return Math.round((completed / activities.length) * 100);
  }, [activities]);

  const grouped = useMemo(() => {
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

  async function upsertFoodLog(payload: {
    foodGroup: string;
    selected: boolean;
    newFood: boolean;
    packaged: boolean;
  }) {
    const previous = foods;

    setFoods((current) => {
      if (!payload.selected) {
        return current.filter((item) => item.food_group !== payload.foodGroup);
      }

      const existing = current.find((item) => item.food_group === payload.foodGroup);
      if (!existing) {
        return [
          ...current,
          {
            id: '',
            date,
            food_group: payload.foodGroup,
            new_food: payload.newFood,
            packaged: payload.packaged
          }
        ];
      }

      return current.map((item) =>
        item.food_group === payload.foodGroup
          ? { ...item, new_food: payload.newFood, packaged: payload.packaged }
          : item
      );
    });

    startTransition(async () => {
      try {
        const res = await fetch('/api/food-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ...payload })
        });
        if (!res.ok) throw new Error('Unable to save food log');
      } catch {
        setFoods(previous);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-500 p-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Ahana Development Tracker</h1>
        <p className="mt-1 text-sm opacity-90">Daily checklist for {date}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/20 p-3">
            <p className="text-xs uppercase">Completion</p>
            <p className="text-2xl font-bold">{completionPercentage}%</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <p className="text-xs uppercase">Weekly streak</p>
            <p className="text-2xl font-bold">{insights.weeklyStreak} days</p>
          </div>
        </div>
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

      <section className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
            <div className="space-y-2">
              {items.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} onChange={upsertDailyLog} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <FoodSelector foods={foods} onChange={upsertFoodLog} />

      {isPending && <p className="text-center text-xs text-slate-500">Saving...</p>}
    </div>
  );
}

import { format, subDays } from 'date-fns';
import { DURATION_TO_MINUTES, LANGUAGE_SKILLS, MOTOR_SKILLS, OUTDOOR_ACTIVITY_KEYWORDS } from '@/lib/constants';
import { ActivityWithLog, DashboardData, FoodLog, HomeInsights } from '@/lib/types';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

type LogWithActivity = {
  date: string;
  completed: boolean;
  duration: string | null;
  activity_id: string;
  activities: { name: string; skill_tags: string[] } | null;
};

function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function durationToMinutes(duration: string | null): number {
  if (!duration) {
    return 0;
  }
  return DURATION_TO_MINUTES[duration] ?? 0;
}

export async function getActivitiesForDate(targetDate: string): Promise<ActivityWithLog[]> {
  const supabase = getServiceSupabaseClient();

  const [{ data: activities, error: activityError }, { data: logs, error: logError }] = await Promise.all([
    supabase.from('activities').select('id, name, category, skill_tags').order('category').order('name'),
    supabase.from('daily_logs').select('id, date, activity_id, completed, rating, duration').eq('date', targetDate)
  ]);

  if (activityError) throw activityError;
  if (logError) throw logError;

  const logByActivityId = new Map((logs ?? []).map((log) => [log.activity_id, log]));

  return (activities ?? []).map((activity) => ({
    ...activity,
    log: logByActivityId.get(activity.id) ?? null
  }));
}

export async function getFoodLogsForDate(targetDate: string): Promise<FoodLog[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('food_logs')
    .select('id, date, food_group, new_food, packaged')
    .eq('date', targetDate);

  if (error) throw error;
  return data ?? [];
}

export async function getHomeInsights(today = new Date()): Promise<HomeInsights> {
  const supabase = getServiceSupabaseClient();
  const todayKey = dateKey(today);

  const [{ count: totalActivities }, { data: todayLogs, error: todayLogsError }] = await Promise.all([
    supabase.from('activities').select('id', { count: 'exact', head: true }),
    supabase.from('daily_logs').select('completed').eq('date', todayKey)
  ]);

  if (todayLogsError) throw todayLogsError;

  const completedToday = (todayLogs ?? []).filter((log) => log.completed).length;
  const completionPercentage = totalActivities ? Math.round((completedToday / totalActivities) * 100) : 0;

  const rangeStart = dateKey(subDays(today, 13));
  const { data: rangeLogs, error: rangeError } = await supabase
    .from('daily_logs')
    .select('date, completed, duration, activity_id, activities(name, skill_tags)')
    .gte('date', rangeStart)
    .order('date', { ascending: true });

  if (rangeError) throw rangeError;

  const typedLogs = (rangeLogs ?? []) as unknown as LogWithActivity[];

  const completionByDay = new Map<string, number>();
  const outdoorByDay = new Map<string, boolean>();
  const languageByDay = new Map<string, number>();

  for (const log of typedLogs) {
    const day = log.date;
    if (log.completed) {
      completionByDay.set(day, (completionByDay.get(day) ?? 0) + 1);

      const lowerName = (log.activities?.name ?? '').toLowerCase();
      const isOutdoor = OUTDOOR_ACTIVITY_KEYWORDS.some((keyword) => lowerName.includes(keyword));
      if (isOutdoor) {
        outdoorByDay.set(day, true);
      }

      const minutes = durationToMinutes(log.duration);
      const hasLanguageSkill = (log.activities?.skill_tags ?? []).some((tag) => LANGUAGE_SKILLS.includes(tag));
      if (hasLanguageSkill) {
        languageByDay.set(day, (languageByDay.get(day) ?? 0) + minutes);
      }
    }
  }

  let weeklyStreak = 0;
  for (let i = 0; i < 7; i += 1) {
    const day = dateKey(subDays(today, i));
    if ((completionByDay.get(day) ?? 0) > 0) {
      weeklyStreak += 1;
      continue;
    }
    break;
  }

  let noOutdoorFor3Days = true;
  let lowLanguageFor3Days = true;
  for (let i = 0; i < 3; i += 1) {
    const day = dateKey(subDays(today, i));
    if (outdoorByDay.get(day)) {
      noOutdoorFor3Days = false;
    }
    if ((languageByDay.get(day) ?? 0) > 15) {
      lowLanguageFor3Days = false;
    }
  }

  return {
    completionPercentage,
    weeklyStreak,
    noOutdoorFor3Days,
    lowLanguageFor3Days
  };
}

export async function getDashboardData(today = new Date()): Promise<DashboardData> {
  const supabase = getServiceSupabaseClient();
  const last7 = dateKey(subDays(today, 6));
  const last14 = dateKey(subDays(today, 13));

  const [{ data: logs7, error: logs7Error }, { data: logs14, error: logs14Error }, { data: food14, error: foodError }] =
    await Promise.all([
      supabase
        .from('daily_logs')
        .select('date, completed, duration, activity_id, activities(name, skill_tags)')
        .gte('date', last7)
        .order('date', { ascending: true }),
      supabase
        .from('daily_logs')
        .select('date, completed, duration, activity_id, activities(name, skill_tags)')
        .gte('date', last14)
        .order('date', { ascending: true }),
      supabase.from('food_logs').select('date, food_group').gte('date', last14).order('date', { ascending: true })
    ]);

  if (logs7Error) throw logs7Error;
  if (logs14Error) throw logs14Error;
  if (foodError) throw foodError;

  const typed7 = (logs7 ?? []) as unknown as LogWithActivity[];
  const typed14 = (logs14 ?? []) as unknown as LogWithActivity[];

  const completed = typed7.filter((log) => log.completed).length;
  const missed = typed7.length - completed;

  const skillMinutesMap = new Map<string, number>();
  for (const log of typed7) {
    if (!log.completed) continue;
    const minutes = durationToMinutes(log.duration);
    for (const skill of log.activities?.skill_tags ?? []) {
      skillMinutesMap.set(skill, (skillMinutesMap.get(skill) ?? 0) + minutes);
    }
  }

  const languageByDay = new Map<string, number>();
  const motorByDay = new Map<string, number>();

  for (let i = 13; i >= 0; i -= 1) {
    const key = dateKey(subDays(today, i));
    languageByDay.set(key, 0);
    motorByDay.set(key, 0);
  }

  for (const log of typed14) {
    if (!log.completed) continue;
    const day = log.date;
    const minutes = durationToMinutes(log.duration);
    const tags = log.activities?.skill_tags ?? [];
    if (tags.some((tag) => LANGUAGE_SKILLS.includes(tag))) {
      languageByDay.set(day, (languageByDay.get(day) ?? 0) + minutes);
    }
    if (tags.some((tag) => MOTOR_SKILLS.includes(tag))) {
      motorByDay.set(day, (motorByDay.get(day) ?? 0) + minutes);
    }
  }

  const foodByDay = new Map<string, Set<string>>();
  for (let i = 13; i >= 0; i -= 1) {
    foodByDay.set(dateKey(subDays(today, i)), new Set());
  }
  for (const item of food14 ?? []) {
    if (!foodByDay.has(item.date)) {
      foodByDay.set(item.date, new Set());
    }
    foodByDay.get(item.date)?.add(item.food_group);
  }

  return {
    completion: { completed, missed },
    skillMinutes: Array.from(skillMinutesMap.entries())
      .map(([skill, minutes]) => ({ skill, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    languageTrend: Array.from(languageByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    foodDiversity: Array.from(foodByDay.entries()).map(([date, groups]) => ({ date, count: groups.size })),
    motorTrend: Array.from(motorByDay.entries()).map(([date, minutes]) => ({ date, minutes }))
  };
}

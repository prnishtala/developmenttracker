import { format, getDay, parseISO, subDays } from 'date-fns';
import { DURATION_TO_MINUTES, LANGUAGE_SKILLS, MOTOR_SKILLS, OUTDOOR_ACTIVITY_KEYWORDS } from '@/lib/constants';
import { ActivityWithLog, CareLog, DashboardData, HomeInsights, NapLog, NutritionLog } from '@/lib/types';
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

function timeToMinutes(timeValue: string | null): number | null {
  if (!timeValue) return null;
  const [hh, mm] = timeValue.split(':');
  const hours = Number(hh);
  const minutes = Number(mm);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function napEntryMinutes(entry: {
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  entry_mode: 'end_time' | 'duration';
}): number {
  if (entry.entry_mode === 'duration') {
    return entry.duration_minutes ?? 0;
  }

  const start = timeToMinutes(entry.start_time);
  const end = timeToMinutes(entry.end_time);
  if (start === null || end === null) return 0;
  return Math.max(0, end - start);
}

function weekdayIndex(targetDate: string): number | null {
  const day = getDay(parseISO(targetDate));
  if (day < 1 || day > 5) return null;
  return day - 1;
}

export async function getPlannedActivitiesForDate(targetDate: string): Promise<ActivityWithLog[]> {
  const supabase = getServiceSupabaseClient();

  const [{ data: activities, error: activityError }, { data: logs, error: logError }] = await Promise.all([
    supabase.from('activities').select('id, name, category, skill_tags').order('category').order('name'),
    supabase.from('daily_logs').select('id, date, activity_id, completed, rating, duration').eq('date', targetDate)
  ]);

  if (activityError) throw activityError;
  if (logError) throw logError;

  const selectedWeekdayIndex = weekdayIndex(targetDate);
  if (selectedWeekdayIndex === null) {
    return [];
  }

  const categoryMap = new Map<string, ActivityWithLog[]>();
  const logByActivityId = new Map((logs ?? []).map((log) => [log.activity_id, log]));

  for (const activity of activities ?? []) {
    const row: ActivityWithLog = {
      ...activity,
      log: logByActivityId.get(activity.id) ?? null
    };

    if (!categoryMap.has(activity.category)) {
      categoryMap.set(activity.category, []);
    }
    categoryMap.get(activity.category)?.push(row);
  }

  const planned: ActivityWithLog[] = [];
  for (const [, list] of categoryMap) {
    const index = selectedWeekdayIndex % list.length;
    planned.push(list[index]);
  }

  return planned;
}

export async function getNutritionLogsForDate(targetDate: string): Promise<NutritionLog[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('id, date, meal_type, had_meal, quantity')
    .eq('date', targetDate);

  if (error) throw error;
  return data ?? [];
}

export async function getCareLogForDate(targetDate: string): Promise<CareLog | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('care_logs')
    .select('id, date, iron_drops, multivitamin_drops, vitamin_c_given, vitamin_c_fruit, bath_completed, bath_duration')
    .eq('date', targetDate)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getNapLogsForDate(targetDate: string): Promise<NapLog[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('nap_logs')
    .select('id, date, start_time, end_time, duration_minutes, entry_mode')
    .eq('date', targetDate)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as NapLog[]).map((item) => ({
    ...item,
    start_time: item.start_time.slice(0, 5),
    end_time: item.end_time ? item.end_time.slice(0, 5) : null
  }));
}

export async function getHomeInsights(today = new Date()): Promise<HomeInsights> {
  const supabase = getServiceSupabaseClient();

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
    weeklyStreak,
    noOutdoorFor3Days,
    lowLanguageFor3Days
  };
}

export async function getDashboardData(today = new Date()): Promise<DashboardData> {
  const supabase = getServiceSupabaseClient();
  const last7 = dateKey(subDays(today, 6));
  const last14 = dateKey(subDays(today, 13));

  const [
    { data: logs7, error: logs7Error },
    { data: logs14, error: logs14Error },
    { data: nutrition14, error: nutritionError },
    { data: care14, error: careError },
    { data: nap14, error: napError }
  ] = await Promise.all([
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
    supabase
      .from('nutrition_logs')
      .select('date, meal_type, had_meal')
      .gte('date', last14)
      .order('date', { ascending: true }),
    supabase
      .from('care_logs')
      .select('date, iron_drops, multivitamin_drops, vitamin_c_given, bath_completed')
      .gte('date', last14)
      .order('date', { ascending: true }),
    supabase
      .from('nap_logs')
      .select('date, start_time, end_time, duration_minutes, entry_mode')
      .gte('date', last14)
      .order('date', { ascending: true })
  ]);

  if (logs7Error) throw logs7Error;
  if (logs14Error) throw logs14Error;
  if (nutritionError) throw nutritionError;
  if (careError) throw careError;
  if (napError) throw napError;

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
  const mealsByDay = new Map<string, number>();
  const careByDay = new Map<string, number>();
  const napMinutesByDay = new Map<string, number>();
  const napCountByDay = new Map<string, number>();

  let ironDays = 0;
  let multivitaminDays = 0;
  let vitaminCDays = 0;
  let bathDays = 0;

  for (let i = 13; i >= 0; i -= 1) {
    const key = dateKey(subDays(today, i));
    foodByDay.set(key, new Set());
    mealsByDay.set(key, 0);
    careByDay.set(key, 0);
    napMinutesByDay.set(key, 0);
    napCountByDay.set(key, 0);
  }

  for (const item of nutrition14 ?? []) {
    if (!item.had_meal) continue;
    if (!foodByDay.has(item.date)) {
      foodByDay.set(item.date, new Set());
    }
    foodByDay.get(item.date)?.add(item.meal_type);
    mealsByDay.set(item.date, (mealsByDay.get(item.date) ?? 0) + 1);
  }

  for (const care of care14 ?? []) {
    let careCount = 0;
    if (care.iron_drops) {
      careCount += 1;
      ironDays += 1;
    }
    if (care.multivitamin_drops) {
      careCount += 1;
      multivitaminDays += 1;
    }
    if (care.vitamin_c_given) {
      careCount += 1;
      vitaminCDays += 1;
    }
    if (care.bath_completed) {
      careCount += 1;
      bathDays += 1;
    }
    careByDay.set(care.date, careCount);
  }

  for (const nap of nap14 ?? []) {
    const minutes = napEntryMinutes({
      start_time: nap.start_time,
      end_time: nap.end_time,
      duration_minutes: nap.duration_minutes,
      entry_mode: nap.entry_mode
    });
    napMinutesByDay.set(nap.date, (napMinutesByDay.get(nap.date) ?? 0) + minutes);
    napCountByDay.set(nap.date, (napCountByDay.get(nap.date) ?? 0) + 1);
  }

  return {
    completion: { completed, missed },
    skillMinutes: Array.from(skillMinutesMap.entries())
      .map(([skill, minutes]) => ({ skill, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    languageTrend: Array.from(languageByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    foodDiversity: Array.from(foodByDay.entries()).map(([date, groups]) => ({ date, count: groups.size })),
    motorTrend: Array.from(motorByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    mealCompletionTrend: Array.from(mealsByDay.entries()).map(([date, meals]) => ({ date, meals })),
    medicineSummary: [
      { label: 'Iron Drops Days', value: ironDays },
      { label: 'Multivitamin Days', value: multivitaminDays },
      { label: 'Vitamin C Support Days', value: vitaminCDays },
      { label: 'Bath Days', value: bathDays }
    ],
    careTrend: Array.from(careByDay.entries()).map(([date, careCount]) => ({ date, careCount })),
    napTrend: Array.from(napMinutesByDay.entries()).map(([date, totalMinutes]) => ({
      date,
      totalMinutes,
      naps: napCountByDay.get(date) ?? 0
    }))
  };
}

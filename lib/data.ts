import { format, getDay, parseISO, subDays } from 'date-fns';
import { buildDashboardNarrative } from '@/lib/dashboard-summary';
import {
  DURATION_TO_MINUTES,
  INDEPENDENCE_SKILLS,
  LANGUAGE_SKILLS,
  MEAL_TYPES,
  MOTOR_SKILLS,
  OUTDOOR_ACTIVITY_KEYWORDS,
  PROBLEM_SOLVING_SKILLS
} from '@/lib/constants';
import {
  addNutrients,
  IRON_DROPS_ELEMENTAL_IRON_MG,
  getToddlerTargets,
  MULTIVITAMIN_ELEMENTAL_IRON_MG,
  roundNutrients,
  zeroNutrients
} from '@/lib/nutrition-ai';
import { estimateMealNutritionBatch, type MealNutritionInput } from '@/lib/nutrition-openai';
import {
  ActivityWithLog,
  AuditLog,
  CareLog,
  DashboardData,
  DashboardSignal,
  DashboardTone,
  HomeInsights,
  NapLog,
  NutritionLog,
  ToddlerEvent,
  ToddlerEventWithFavorite,
  ChildProfile,
  GrowthMeasurement,
  MilestoneRecord
} from '@/lib/types';
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

function minutesToClock(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const suffix = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${suffix}`;
}

function averageMinutes(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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


function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function average(value: number, count: number): number {
  if (count <= 0) return 0;
  return value / count;
}

function toneFromCoverage(coveragePercent: number): DashboardTone {
  if (coveragePercent >= 90) return 'good';
  if (coveragePercent >= 70) return 'neutral';
  return 'watch';
}

export async function getPlannedActivitiesForDate(targetDate: string): Promise<ActivityWithLog[]> {
  const supabase = getServiceSupabaseClient();

  const [{ data: activities, error: activityError }, { data: logs, error: logError }] = await Promise.all([
    supabase.from('activities').select('id, name, category, skill_tags, how_to').order('category').order('name'),
    supabase.from('daily_logs').select('id, date, activity_id, completed, rating, duration').eq('date', targetDate)
  ]);

  if (activityError) throw activityError;
  if (logError) throw logError;

  // Rotate across all 7 days so weekends get activities too (0 = Sun .. 6 = Sat).
  const rotationIndex = getDay(parseISO(targetDate));

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
    const index = rotationIndex % list.length;
    planned.push(list[index]);
  }

  return planned;
}

export async function getAuditLogs(limit = 200): Promise<AuditLog[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, created_at, event_type, action, entity_type, entity_id, event_date, request_ip, user_agent, payload')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function getNutritionLogsForDate(targetDate: string): Promise<NutritionLog[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('id, date, meal_type, had_meal, quantity, meal_notes')
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
      .select('id, date, meal_type, had_meal, quantity, meal_notes')
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
  const independenceByDay = new Map<string, number>();
  const problemSolvingByDay = new Map<string, number>();

  for (let i = 13; i >= 0; i -= 1) {
    const key = dateKey(subDays(today, i));
    languageByDay.set(key, 0);
    motorByDay.set(key, 0);
    independenceByDay.set(key, 0);
    problemSolvingByDay.set(key, 0);
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
    if (tags.some((tag) => INDEPENDENCE_SKILLS.includes(tag))) {
      independenceByDay.set(day, (independenceByDay.get(day) ?? 0) + minutes);
    }
    if (tags.some((tag) => PROBLEM_SOLVING_SKILLS.includes(tag))) {
      problemSolvingByDay.set(day, (problemSolvingByDay.get(day) ?? 0) + minutes);
    }
  }

  const foodByDay = new Map<string, Set<string>>();
  const mealsByDay = new Map<string, number>();
  const mealSlotCounts = new Map<string, number>();
  const caloriesByDay = new Map<string, number>();
  const careByDay = new Map<string, number>();
  const supplementIronByDay = new Map<string, number>();
  const napMinutesByDay = new Map<string, number>();
  const napCountByDay = new Map<string, number>();
  const napStartByDay = new Map<string, number>();
  const nutrientByDay = new Map<string, ReturnType<typeof zeroNutrients>>();
  const totalLoggedNutrients = zeroNutrients();
  const distinctFoods = new Set<string>();

  let ironDays = 0;
  let multivitaminDays = 0;
  let vitaminCDays = 0;
  let bathDays = 0;
  let supplementIronMgTotal = 0;
  let supplementIronDays = 0;
  let mealEntries = 0;
  let notedMeals = 0;
  let recognizableMeals = 0;

  for (let i = 13; i >= 0; i -= 1) {
    const key = dateKey(subDays(today, i));
    foodByDay.set(key, new Set());
    mealsByDay.set(key, 0);
    for (const mealType of MEAL_TYPES) {
      if (!mealSlotCounts.has(mealType)) {
        mealSlotCounts.set(mealType, 0);
      }
    }
    caloriesByDay.set(key, 0);
    careByDay.set(key, 0);
    supplementIronByDay.set(key, 0);
    napMinutesByDay.set(key, 0);
    napCountByDay.set(key, 0);
    napStartByDay.set(key, Number.POSITIVE_INFINITY);
    nutrientByDay.set(key, zeroNutrients());
  }

  const mealInputs: MealNutritionInput[] = (nutrition14 ?? [])
    .filter((item) => item.had_meal)
    .map((item) => ({
      id: item.id,
      date: item.date,
      mealType: item.meal_type,
      quantity: item.quantity,
      mealNotes: item.meal_notes
    }));

  const mealEstimates = await estimateMealNutritionBatch(mealInputs);

  let openAiMealCount = 0;
  let heuristicMealCount = 0;

  for (const item of nutrition14 ?? []) {
    if (!item.had_meal) continue;
    mealEntries += 1;

    if (item.meal_notes?.trim()) {
      notedMeals += 1;
    }

    const estimated =
      mealEstimates.get(item.id) ?? {
        ...zeroNutrients(),
        recognizedFoods: [],
        confidence: 'low' as const,
        source: 'heuristic' as const
      };

    if (estimated.source === 'openai') {
      openAiMealCount += 1;
    } else {
      heuristicMealCount += 1;
    }

    const recognizedFoods = estimated.recognizedFoods.length > 0 ? estimated.recognizedFoods : [item.meal_type];
    if (estimated.recognizedFoods.length > 0) {
      recognizableMeals += 1;
    }
    const foodBucket = foodByDay.get(item.date);
    for (const food of recognizedFoods) {
      foodBucket?.add(food);
      distinctFoods.add(food);
    }

    if (MEAL_TYPES.includes(item.meal_type as (typeof MEAL_TYPES)[number])) {
      mealSlotCounts.set(item.meal_type, (mealSlotCounts.get(item.meal_type) ?? 0) + 1);
    }

    mealsByDay.set(item.date, (mealsByDay.get(item.date) ?? 0) + 1);
    caloriesByDay.set(item.date, (caloriesByDay.get(item.date) ?? 0) + estimated.calories);

    if (!nutrientByDay.has(item.date)) {
      nutrientByDay.set(item.date, zeroNutrients());
    }
    addNutrients(nutrientByDay.get(item.date)!, estimated);
    addNutrients(totalLoggedNutrients, estimated);
  }

  for (const care of care14 ?? []) {
    let careCount = 0;
    let supplementIronMg = 0;
    if (care.iron_drops) {
      careCount += 1;
      ironDays += 1;
      supplementIronMg += IRON_DROPS_ELEMENTAL_IRON_MG;
    }
    if (care.multivitamin_drops) {
      careCount += 1;
      multivitaminDays += 1;
      supplementIronMg += MULTIVITAMIN_ELEMENTAL_IRON_MG;
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
    supplementIronByDay.set(care.date, supplementIronMg);
    if (supplementIronMg > 0) {
      supplementIronMgTotal += supplementIronMg;
      supplementIronDays += 1;
      nutrientByDay.get(care.date)!.iron_mg += supplementIronMg;
      totalLoggedNutrients.iron_mg += supplementIronMg;
    }
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
    const startMinutes = timeToMinutes(nap.start_time);
    if (startMinutes !== null) {
      napStartByDay.set(nap.date, Math.min(napStartByDay.get(nap.date) ?? Number.POSITIVE_INFINITY, startMinutes));
    }
  }

  const totalMealsLogged = Array.from(mealsByDay.values()).reduce((sum, value) => sum + value, 0);
  const daysWithMeals = Array.from(mealsByDay.values()).filter((value) => value > 0).length;
  const nutritionActiveDays = Array.from(mealsByDay.keys()).filter(
    (date) => (mealsByDay.get(date) ?? 0) > 0 || (supplementIronByDay.get(date) ?? 0) > 0
  ).length;
  const fullyLoggedDays = Array.from(mealsByDay.values()).filter((value) => value >= 3).length;
  const averageMealsPerDay = Number(average(totalMealsLogged, 14).toFixed(1));
  const notesCoveragePercent = percentage(notedMeals, mealEntries);
  const recognizableMealsPercent = percentage(recognizableMeals, mealEntries);

  const loggedDayDivisor = Math.max(nutritionActiveDays, 1);
  const averageEstimated = roundNutrients({
    calories: average(totalLoggedNutrients.calories, loggedDayDivisor),
    protein_g: average(totalLoggedNutrients.protein_g, loggedDayDivisor),
    carbs_g: average(totalLoggedNutrients.carbs_g, loggedDayDivisor),
    fat_g: average(totalLoggedNutrients.fat_g, loggedDayDivisor),
    iron_mg: average(totalLoggedNutrients.iron_mg, loggedDayDivisor),
    calcium_mg: average(totalLoggedNutrients.calcium_mg, loggedDayDivisor),
    vitamin_c_mg: average(totalLoggedNutrients.vitamin_c_mg, loggedDayDivisor)
  });

  const todayKey = dateKey(today);
  const loggedSnapshotKey =
    Array.from(mealsByDay.entries())
      .filter(([date, meals]) => meals > 0 || (supplementIronByDay.get(date) ?? 0) > 0)
      .map(([date]) => date)
      .slice(-1)[0] ?? todayKey;
  const snapshotKey = (mealsByDay.get(todayKey) ?? 0) > 0 ? todayKey : loggedSnapshotKey;
  const snapshotEstimated = roundNutrients(nutrientByDay.get(snapshotKey) ?? zeroNutrients());
  const targets = getToddlerTargets();

  const nutritionComparison = [
    { nutrient: 'Calories', estimated: snapshotEstimated.calories, target: targets.calories, unit: 'kcal' },
    { nutrient: 'Protein', estimated: snapshotEstimated.protein_g, target: targets.protein_g, unit: 'g' },
    { nutrient: 'Iron', estimated: snapshotEstimated.iron_mg, target: targets.iron_mg, unit: 'mg' },
    { nutrient: 'Calcium', estimated: snapshotEstimated.calcium_mg, target: targets.calcium_mg, unit: 'mg' },
    { nutrient: 'Vitamin C', estimated: snapshotEstimated.vitamin_c_mg, target: targets.vitamin_c_mg, unit: 'mg' }
  ];

  const nutrientCoverage = [
    {
      nutrient: 'Calories',
      estimated: averageEstimated.calories,
      target: targets.calories,
      unit: 'kcal',
      daysMetTarget: Array.from(nutrientByDay.values()).filter((value) => value.calories >= targets.calories * 0.85).length
    },
    {
      nutrient: 'Protein',
      estimated: averageEstimated.protein_g,
      target: targets.protein_g,
      unit: 'g',
      daysMetTarget: Array.from(nutrientByDay.values()).filter((value) => value.protein_g >= targets.protein_g).length
    },
    {
      nutrient: 'Iron',
      estimated: averageEstimated.iron_mg,
      target: targets.iron_mg,
      unit: 'mg',
      daysMetTarget: Array.from(nutrientByDay.values()).filter((value) => value.iron_mg >= targets.iron_mg).length
    },
    {
      nutrient: 'Calcium',
      estimated: averageEstimated.calcium_mg,
      target: targets.calcium_mg,
      unit: 'mg',
      daysMetTarget: Array.from(nutrientByDay.values()).filter((value) => value.calcium_mg >= targets.calcium_mg).length
    },
    {
      nutrient: 'Vitamin C',
      estimated: averageEstimated.vitamin_c_mg,
      target: targets.vitamin_c_mg,
      unit: 'mg',
      daysMetTarget: Array.from(nutrientByDay.values()).filter((value) => value.vitamin_c_mg >= targets.vitamin_c_mg).length
    }
  ].map((item) => {
    const coveragePercent = percentage(item.estimated, item.target);
    return {
      ...item,
      coveragePercent,
      tone: toneFromCoverage(coveragePercent)
    };
  });

  const lowNutrients = nutrientCoverage
    .filter((item) => item.nutrient !== 'Calories' && item.coveragePercent < 70)
    .map((item) => item.nutrient);
  const strongNutrients = nutrientCoverage
    .filter((item) => item.nutrient !== 'Calories' && item.coveragePercent >= 90)
    .map((item) => item.nutrient);

  const nutritionInsights: string[] = [];
  if (daysWithMeals < 7) {
    nutritionInsights.push(`Only ${daysWithMeals} of the last 14 days have meal logs, so nutrition insight is directional rather than complete.`);
  }

  if (supplementIronMgTotal > 0) {
    nutritionInsights.push(
      `Iron supplements contributed ${supplementIronMgTotal} mg of elemental iron across ${supplementIronDays} care days: 25 mg from iron drops and 10 mg from multivitamin on days given.`
    );
  }

  if (averageEstimated.calories < targets.calories * 0.8) {
    nutritionInsights.push('Average calories look low on logged days. A dense snack like banana with curd, paneer, or egg can help.');
  } else if (averageEstimated.calories > targets.calories * 1.2) {
    nutritionInsights.push('Average calories look high on logged days. Balance heavy meals with fruit and vegetables.');
  } else {
    nutritionInsights.push('Average calories are close to the daily target on logged days.');
  }

  if (lowNutrients.includes('Protein')) {
    nutritionInsights.push('Protein is the clearest gap. Add dal, paneer, egg, or curd more consistently.');
  }
  if (lowNutrients.includes('Iron')) {
    nutritionInsights.push('Iron appears low. Use lentils or leafy foods and pair them with vitamin C fruit.');
  }
  if (lowNutrients.includes('Calcium')) {
    nutritionInsights.push('Calcium seems light. Add curd, paneer, or ragi-based foods each day.');
  }
  if (recognizableMealsPercent < 60) {
    nutritionInsights.push('A lot of meal notes cannot be mapped to known foods yet, so nutrient estimates may be understated.');
  }
  if (nutritionInsights.length === 1) {
    nutritionInsights.push('Nutrition balance looks reasonable based on the foods and quantities captured so far.');
  }

  const recentLanguageMinutes = Array.from(languageByDay.values())
    .slice(-7)
    .reduce((sum, value) => sum + value, 0);
  const recentMotorMinutes = Array.from(motorByDay.values())
    .slice(-7)
    .reduce((sum, value) => sum + value, 0);
  const careDaysLogged = Array.from(careByDay.values()).filter((value) => value > 0).length;
  const totalNapMinutes = Array.from(napMinutesByDay.values()).reduce((sum, value) => sum + value, 0);
  const daysWithNaps = Array.from(napCountByDay.values()).filter((value) => value > 0).length;
  const averageNapMinutes = Math.round(average(totalNapMinutes, Math.max(daysWithNaps, 1)));
  const calorieCoveragePercent = percentage(averageEstimated.calories, targets.calories);

  const developmentSummary =
    recentLanguageMinutes + recentMotorMinutes >= 180
      ? `Development activity stayed active this week with ${recentLanguageMinutes} language minutes and ${recentMotorMinutes} motor minutes.`
      : `Development activity looks lighter this week with ${recentLanguageMinutes} language minutes and ${recentMotorMinutes} motor minutes.`;
  const careSummary =
    careDaysLogged >= 10
      ? `Care routines were logged on ${careDaysLogged} of the last 14 days.`
      : `Care routines were logged on ${careDaysLogged} of the last 14 days, so some consistency may still be missing.`;

  const mealCoverageRows = MEAL_TYPES.map((mealType) => ({
    mealType,
    count: mealSlotCounts.get(mealType) ?? 0
  }));
  const mostLoggedMeal = [...mealCoverageRows].sort((a, b) => b.count - a.count)[0];
  const leastLoggedMeal = [...mealCoverageRows].sort((a, b) => a.count - b.count)[0];

  const routineInsights: string[] = [];
  const napStartCandidates = Array.from(napStartByDay.values()).filter((value) => Number.isFinite(value));
  const averageNapStart = averageMinutes(napStartCandidates);
  if (averageNapStart !== null) {
    const avgNapDuration = Math.round(averageNapMinutes);
    routineInsights.push(`The first nap usually starts around ${minutesToClock(Math.round(averageNapStart))} and lasts about ${avgNapDuration} minutes.`);
  }

  if (mostLoggedMeal) {
    routineInsights.push(
      `${mostLoggedMeal.mealType} is the most consistently captured meal slot (${mostLoggedMeal.count}/14 days).`
    );
  }

  if (leastLoggedMeal) {
    routineInsights.push(
      `${leastLoggedMeal.mealType} is the least consistently logged meal slot, so that is a good place for a quick note when it happens.`
    );
  }

  if (mealEntries > 0 && notedMeals / mealEntries < 0.75) {
    routineInsights.push('A short note for each meal would make the day rhythm much easier to interpret later.');
  }

  const confidenceLevel =
    daysWithMeals >= 10 && notesCoveragePercent >= 75 && recognizableMealsPercent >= 60
      ? 'high'
      : daysWithMeals >= 7 && notesCoveragePercent >= 50 && recognizableMealsPercent >= 40
        ? 'medium'
        : 'low';
  const confidenceReason =
    confidenceLevel === 'high'
      ? 'Meal logging is detailed enough for the AI to estimate nutrients with good confidence.'
      : confidenceLevel === 'medium'
        ? 'Some meals are well described, but a few notes are still too brief or use unfamiliar food names.'
        : 'The meal logs are still sparse or too brief for nutrient estimates to be very precise.';

  const narrative = await buildDashboardNarrative({
    snapshotDate: snapshotKey,
    daysWithMeals,
    fullyLoggedDays,
    averageMealsPerDay,
    notesCoveragePercent,
    recognizableMealsPercent,
    averageCalories: averageEstimated.calories,
    calorieCoveragePercent,
    supplementIronMg: supplementIronMgTotal,
    supplementIronDays,
    lowNutrients,
    strongNutrients,
    developmentSummary,
    careSummary
  });

  const summaryCards: DashboardSignal[] = [
    {
      label: 'Nutrition coverage',
      value: `${calorieCoveragePercent}%`,
      detail: `Average calories vs target across ${daysWithMeals} logged days.`,
      tone: toneFromCoverage(calorieCoveragePercent)
    },
    {
      label: 'Meal logging',
      value: `${daysWithMeals}/14 days`,
      detail: `${fullyLoggedDays} full 3-meal days. ${distinctFoods.size} foods recognized and notes on ${notesCoveragePercent}% of meals.`,
      tone: daysWithMeals >= 10 ? 'good' : daysWithMeals >= 7 ? 'neutral' : 'watch'
    },
    {
      label: 'Development',
      value: `${recentLanguageMinutes + recentMotorMinutes} min`,
      detail: `${recentLanguageMinutes} language and ${recentMotorMinutes} motor minutes in the last 7 days.`,
      tone: recentLanguageMinutes + recentMotorMinutes >= 180 ? 'good' : 'neutral'
    },
    {
      label: 'Care + naps',
      value: `${careDaysLogged}/14 days`,
      detail:
        daysWithNaps > 0
          ? `Average nap time is ${averageNapMinutes} minutes on days naps were logged.`
          : 'No naps were logged in the last 14 days.',
      tone: careDaysLogged >= 10 ? 'good' : careDaysLogged >= 7 ? 'neutral' : 'watch'
    }
  ];

  return {
    completion: { completed, missed },
    skillMinutes: Array.from(skillMinutesMap.entries())
      .map(([skill, minutes]) => ({ skill, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    languageTrend: Array.from(languageByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    foodDiversity: Array.from(foodByDay.entries()).map(([date, foods]) => ({ date, count: foods.size })),
    calorieTrend: Array.from(caloriesByDay.entries()).map(([date, calories]) => ({ date, calories: Math.round(calories) })),
    motorTrend: Array.from(motorByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    independenceTrend: Array.from(independenceByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    problemSolvingTrend: Array.from(problemSolvingByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
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
    })),
    routineInsights,
    summaryCards,
    narrative,
    nutritionSnapshot: {
      calculationSource:
        openAiMealCount > 0 && heuristicMealCount > 0
          ? 'mixed'
          : openAiMealCount > 0
            ? 'openai'
            : 'heuristic',
      latestDate: snapshotKey,
      confidenceLevel,
      confidenceReason,
      supplementIronMg: supplementIronMgTotal,
      supplementIronDays,
      estimated: snapshotEstimated,
      targets,
      comparison: nutritionComparison,
      coverage: nutrientCoverage,
      daysWithMeals,
      fullyLoggedDays,
      averageMealsPerDay,
      notesCoveragePercent,
      recognizableMealsPercent,
      insights: nutritionInsights
    }
  };
}

const EVENT_COLUMNS =
  'id, title, description, event_date, start_time, end_time, venue_name, city, address, is_free, cost_text, setting, category, min_age_months, max_age_months, event_type, source_url, booking_url, verified, last_checked_at';

// Reads upcoming events within [from, to] plus all ongoing attractions
// (event_date is null), tagged with whether each is favorited. Ordered so
// ongoing attractions surface first, then soonest dated events.
export async function getEventsInWindow(from: string, to: string): Promise<ToddlerEventWithFavorite[]> {
  const supabase = getServiceSupabaseClient();

  const [{ data: events, error: eventsError }, { data: favorites, error: favoritesError }] = await Promise.all([
    supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .or(`event_date.is.null,and(event_date.gte.${from},event_date.lte.${to})`)
      .order('event_date', { ascending: true, nullsFirst: true }),
    supabase.from('event_favorites').select('event_id')
  ]);

  if (eventsError) throw eventsError;
  if (favoritesError) throw favoritesError;

  const favoriteIds = new Set((favorites ?? []).map((row) => row.event_id as string));

  return ((events ?? []) as ToddlerEvent[]).map((event) => ({
    ...event,
    favorited: favoriteIds.has(event.id)
  }));
}

// Returns events happening on the given specific dates (used by the weekend digest).
export async function getEventsOnDates(dates: string[]): Promise<ToddlerEvent[]> {
  if (dates.length === 0) return [];
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .in('event_date', dates)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ToddlerEvent[];
}

export async function getChildProfile(): Promise<ChildProfile | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('child_profile')
    .select('id, name, birth_date, sex')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ChildProfile) ?? null;
}

export async function getGrowthMeasurements(): Promise<GrowthMeasurement[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('growth_measurements')
    .select('id, measured_on, weight_kg, height_cm, head_circumference_cm, notes')
    .order('measured_on', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GrowthMeasurement[];
}

export async function getMilestoneRecords(): Promise<MilestoneRecord[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('milestone_records')
    .select('milestone_key, status, noted_on, notes');
  if (error) throw error;
  return (data ?? []) as MilestoneRecord[];
}

export async function getDayNote(targetDate: string): Promise<string | null> {
  const supabase = getServiceSupabaseClient();
  // Fail soft so the Home page still loads before the day_notes migration is run.
  try {
    const { data, error } = await supabase.from('day_notes').select('notes').eq('date', targetDate).maybeSingle();
    if (error) return null;
    return (data?.notes as string | undefined) ?? null;
  } catch {
    return null;
  }
}

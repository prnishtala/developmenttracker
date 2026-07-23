export type Activity = {
  id: string;
  name: string;
  category: string;
  skill_tags: string[];
  how_to: string | null;
};

export type DailyLog = {
  id: string;
  date: string;
  activity_id: string;
  completed: boolean;
  rating: string | null;
  duration: string | null;
};

export type NutritionLog = {
  id: string;
  date: string;
  meal_type: string;
  had_meal: boolean;
  quantity: string | null;
  meal_notes: string | null;
};

export type CareLog = {
  id: string;
  date: string;
  iron_drops: boolean;
  multivitamin_drops: boolean;
  vitamin_c_given: boolean;
  vitamin_c_fruit: string | null;
  bath_completed: boolean;
  bath_duration: string | null;
};

export type NapLog = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  entry_mode: 'end_time' | 'duration';
};

export type ActivityWithLog = Activity & {
  log: DailyLog | null;
};

export type EventSetting = 'indoor' | 'outdoor' | 'both';
export type EventType = 'one_time' | 'recurring' | 'attraction';
export type EventSourceType = 'ics' | 'json' | 'html' | 'ai_discovery';

export type ToddlerEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  city: string;
  address: string | null;
  is_free: boolean;
  cost_text: string | null;
  setting: EventSetting;
  category: string;
  min_age_months: number | null;
  max_age_months: number | null;
  event_type: EventType;
  source_url: string;
  booking_url: string | null;
  verified: boolean;
  last_checked_at: string;
};

export type ToddlerEventWithFavorite = ToddlerEvent & {
  favorited: boolean;
};

export type ChildProfile = {
  id: string;
  name: string;
  birth_date: string | null;
  sex: 'female' | 'male';
};

export type GrowthMeasurement = {
  id: string;
  measured_on: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  notes: string | null;
};

export type MilestoneRecord = {
  milestone_key: string;
  status: 'achieved' | 'emerging' | 'not_yet';
  noted_on: string | null;
  notes: string | null;
};

export type EventSource = {
  id: string;
  name: string;
  city: string;
  url: string;
  source_type: EventSourceType;
  category_hint: string | null;
  active: boolean;
  notes: string | null;
};

export type DashboardTone = 'good' | 'watch' | 'neutral';

export type DashboardSignal = {
  label: string;
  value: string;
  detail: string;
  tone: DashboardTone;
};

export type DashboardNarrative = {
  headline: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  actions: string[];
  watchNext: string[];
  dataQuality: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  source: 'rule-based' | 'openai';
};

export type DashboardData = {
  completion: { completed: number; missed: number };
  skillMinutes: { skill: string; minutes: number }[];
  languageTrend: { date: string; minutes: number }[];
  foodDiversity: { date: string; count: number }[];
  calorieTrend: { date: string; calories: number }[];
  motorTrend: { date: string; minutes: number }[];
  independenceTrend: { date: string; minutes: number }[];
  problemSolvingTrend: { date: string; minutes: number }[];
  mealCompletionTrend: { date: string; meals: number }[];
  medicineSummary: { label: string; value: number }[];
  careTrend: { date: string; careCount: number }[];
  napTrend: { date: string; totalMinutes: number; naps: number }[];
  routineInsights: string[];
  summaryCards: DashboardSignal[];
  narrative: DashboardNarrative;
  nutritionSnapshot: {
    calculationSource: 'openai' | 'mixed' | 'heuristic';
    latestDate: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    confidenceReason: string;
    supplementIronMg: number;
    supplementIronDays: number;
    estimated: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      iron_mg: number;
      calcium_mg: number;
      vitamin_c_mg: number;
    };
    targets: {
      calories: number;
      protein_g: number;
      iron_mg: number;
      calcium_mg: number;
      vitamin_c_mg: number;
    };
    comparison: { nutrient: string; estimated: number; target: number; unit: string }[];
    coverage: {
      nutrient: string;
      estimated: number;
      target: number;
      unit: string;
      coveragePercent: number;
      daysMetTarget: number;
      tone: DashboardTone;
    }[];
    daysWithMeals: number;
    fullyLoggedDays: number;
    averageMealsPerDay: number;
    notesCoveragePercent: number;
    recognizableMealsPercent: number;
    insights: string[];
  };
};

export type HomeInsights = {
  weeklyStreak: number;
  noOutdoorFor3Days: boolean;
  lowLanguageFor3Days: boolean;
};

export type AuditLog = {
  id: string;
  created_at: string;
  event_type: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  event_date: string | null;
  request_ip: string | null;
  user_agent: string | null;
  payload: Record<string, unknown> | null;
};

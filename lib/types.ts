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

export type DashboardData = {
  completion: { completed: number; missed: number };
  skillMinutes: { skill: string; minutes: number }[];
  languageTrend: { date: string; minutes: number }[];
  foodDiversity: { date: string; count: number }[];
  calorieTrend: { date: string; calories: number }[];
  motorTrend: { date: string; minutes: number }[];
  mealCompletionTrend: { date: string; meals: number }[];
  medicineSummary: { label: string; value: number }[];
  careTrend: { date: string; careCount: number }[];
  napTrend: { date: string; totalMinutes: number; naps: number }[];
  nutritionSnapshot: {
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

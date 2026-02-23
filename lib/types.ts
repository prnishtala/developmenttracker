export type Activity = {
  id: string;
  name: string;
  category: string;
  skill_tags: string[];
};

export type DailyLog = {
  id: string;
  date: string;
  activity_id: string;
  completed: boolean;
  rating: string | null;
  duration: string | null;
};

export type FoodLog = {
  id: string;
  date: string;
  food_group: string;
  new_food: boolean;
  packaged: boolean;
};

export type ActivityWithLog = Activity & {
  log: DailyLog | null;
};

export type DashboardData = {
  completion: { completed: number; missed: number };
  skillMinutes: { skill: string; minutes: number }[];
  languageTrend: { date: string; minutes: number }[];
  foodDiversity: { date: string; count: number }[];
  motorTrend: { date: string; minutes: number }[];
};

export type HomeInsights = {
  completionPercentage: number;
  weeklyStreak: number;
  noOutdoorFor3Days: boolean;
  lowLanguageFor3Days: boolean;
};

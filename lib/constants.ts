export const RATING_OPTIONS = ['Bad', 'Ok', 'Good', 'Very Good'] as const;

export const DURATION_OPTIONS = ['0 to 5', '5 to 10', '10 to 20', '20 plus'] as const;

export const DURATION_TO_MINUTES: Record<string, number> = {
  '0 to 5': 5,
  '5 to 10': 10,
  '10 to 20': 20,
  '20 plus': 25
};

export const LANGUAGE_SKILLS = ['Vocabulary', 'Expressive Language', 'Receptive Language'];
export const MOTOR_SKILLS = ['Gross Motor', 'Fine Motor'];
export const INDEPENDENCE_SKILLS = ['Independence'];
export const PROBLEM_SOLVING_SKILLS = ['Problem Solving'];
export const OUTDOOR_ACTIVITY_KEYWORDS = ['outdoor'];

export const MEAL_TYPES = [
  'Breakfast',
  'Mid-morning snack',
  'Lunch',
  'Pre-dinner snack',
  'Dinner',
  'A2 milk'
] as const;
export const QUANTITY_OPTIONS = ['Low', 'Normal', 'High'] as const;

export const VITAMIN_C_FRUITS = ['Orange', 'Mosambi', 'Guava', 'Kiwi', 'Strawberry', 'Papaya'] as const;
export const BATH_DURATION_OPTIONS = DURATION_OPTIONS;

export const NAP_DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120] as const;

// "Things To Do" — local DFW toddler events discovery
export const CITY_OPTIONS = [
  'Irving',
  'Dallas',
  'Fort Worth',
  'Plano',
  'Frisco',
  'Arlington',
  'Grand Prairie',
  'McKinney',
  'Grapevine',
  'Garland',
  'Richardson',
  'Denton',
  'DFW'
] as const;

export const EVENT_CATEGORIES = [
  'Storytime',
  'Workshop',
  'Animals/Farm',
  'Train/Ride',
  'Museum',
  'Nature',
  'Music',
  'Festival',
  'Other'
] as const;

export const SETTING_OPTIONS = ['indoor', 'outdoor', 'both'] as const;

export const COST_FILTERS = ['Free', 'Paid', 'All'] as const;

export const DATE_SCOPES = ['This weekend', 'This week', 'Next 4 weeks'] as const;

// Age filter bands. An event "fits" a band when its [min, max] month range
// overlaps the band (nulls are treated as open-ended).
export const AGE_BANDS = [
  { label: 'Ahana (~18–24 mo)', minMonths: 12, maxMonths: 30 },
  { label: 'Any young kid (0–5)', minMonths: 0, maxMonths: 72 }
] as const;

export const EVENTS_HORIZON_DAYS = 28;

export function getTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

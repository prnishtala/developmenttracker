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
export const OUTDOOR_ACTIVITY_KEYWORDS = ['outdoor'];

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Evening snacks'] as const;
export const QUANTITY_OPTIONS = ['Low', 'Normal', 'High'] as const;

export const VITAMIN_C_FRUITS = ['Orange', 'Mosambi', 'Guava', 'Kiwi', 'Strawberry', 'Papaya'] as const;
export const BATH_DURATION_OPTIONS = DURATION_OPTIONS;

export const NAP_DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120] as const;

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

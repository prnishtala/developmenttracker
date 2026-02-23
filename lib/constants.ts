export const RATING_OPTIONS = ['Bad', 'Ok', 'Good', 'Very Good'] as const;

export const DURATION_OPTIONS = ['0 to 5', '5 to 10', '10 to 20', '20 plus'] as const;

export const DURATION_TO_MINUTES: Record<string, number> = {
  '0 to 5': 5,
  '5 to 10': 10,
  '10 to 20': 20,
  '20 plus': 25
};

export const FOOD_GROUPS = [
  'Vegetables',
  'Fruits',
  'Lentils and legumes',
  'Grains',
  'Nuts and seeds powder',
  'Healthy fats',
  'Protein sources',
  'Iron rich foods'
] as const;

export const SUGAR_RELATED_GROUPS = ['Fruits', 'Grains'];

export const LANGUAGE_SKILLS = ['Vocabulary', 'Expressive Language', 'Receptive Language'];
export const MOTOR_SKILLS = ['Gross Motor', 'Fine Motor'];
export const OUTDOOR_ACTIVITY_KEYWORDS = ['outdoor'];

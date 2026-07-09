import { RampConfig, Routine, WeeklyDecision } from '@/lib/types';
import { dinnerRoutines, wednesdayBatchRoutines } from './dinners';
import { SCHEDULE_ROUTINES } from './schedule';
import { REFERENCE_ROUTINES } from './reference';

/**
 * The complete Family OS seed. This is the app's source of truth for routines —
 * bundled so the app works offline with zero setup. Supabase stores only the
 * small mutable state (completions, weekly decisions, capture notes, ramps).
 * `scripts/push-seed.ts` can also load this into Supabase for cross-referencing.
 */
export const ROUTINES: Routine[] = [
  ...SCHEDULE_ROUTINES,
  ...dinnerRoutines(),
  ...wednesdayBatchRoutines(),
  ...REFERENCE_ROUTINES
];

export const SCHEDULED_ROUTINES = ROUTINES.filter((r) => r.category !== 'reference');
export const REFERENCE_ONLY = ROUTINES.filter((r) => r.category === 'reference');

/**
 * Default bedtime ramps. These are editable in Settings — the start date is when
 * each ramp began, and the helper computes tonight's target from it.
 */
export const DEFAULT_RAMPS: RampConfig[] = [
  {
    personKey: 'prakash',
    type: 'bedtime',
    startDate: '2026-07-06',
    startTime: '02:00',
    targetTime: '23:30',
    stepMinutes: 15,
    stepDays: 3
  },
  {
    personKey: 'ahana',
    type: 'bedtime',
    startDate: '2026-07-06',
    startTime: '23:00',
    targetTime: '21:45',
    stepMinutes: 15,
    stepDays: 3
  }
];

/** No decisions set by default — owners fall back to their seed defaults. */
export const DEFAULT_DECISIONS: WeeklyDecision[] = [];

export function routineById(id: string): Routine | undefined {
  return ROUTINES.find((r) => r.id === id);
}

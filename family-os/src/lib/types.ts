// Shared domain types for Family OS. Pure TypeScript — imported by both the
// Expo app and the Node seed/verify scripts, so no React Native imports here.

export type PersonKey = 'prakash' | 'shraddha' | 'ahana' | 'shared';

export type View = 'prakash' | 'shraddha' | 'family';

export type Category =
  | 'sleep'
  | 'wake'
  | 'work'
  | 'commute'
  | 'childcare'
  | 'meal'
  | 'batch_cook'
  | 'medication'
  | 'fitness'
  | 'chore'
  | 'errand'
  | 'review'
  | 'ritual'
  | 'outdoor'
  | 'personal'
  | 'reference';

/** One block of a runbook: an optional heading plus ordered lines. */
export interface RunbookSection {
  heading?: string;
  /** Rendered as an ordered checklist when `ordered` is true, else bullets. */
  ordered?: boolean;
  steps: string[];
}

/** The complete "no decision to make, just execution" detail behind a block. */
export interface Runbook {
  /** One or two sentences of framing, shown at the top of the detail screen. */
  summary?: string;
  sections: RunbookSection[];
  /** The plan's recurring "bad week? minimum viable = ..." escape hatch. */
  minViable?: string;
  /** e.g. gym is gated until the bedtime ramp is reliably <= 12:30 AM. */
  gating?: string;
  notes?: string[];
}

export interface NotifySpec {
  /** Minutes before start to fire a reminder. 0 = at start. null = none. */
  minutesBefore: number;
}

export interface Routine {
  /** Stable slug id, unique across the seed. */
  id: string;
  /** Original ICS UID when derived from a calendar, for idempotent upserts. */
  sourceUid?: string;
  owner: PersonKey;
  category: Category;
  /** Full title. */
  title: string;
  /** Terse one-line label for the timeline (the "line, not the recipe"). */
  terseLine: string;
  /** Local wall-clock start "HH:mm" (America/Chicago). Empty for reference cards. */
  startLocal: string;
  /** Local wall-clock end "HH:mm". */
  endLocal: string;
  timezone: string;
  /** RRULE string without the DTSTART line, e.g. "FREQ=WEEKLY;BYDAY=MO,TU". */
  rrule: string;
  /** Local anchor date "YYYY-MM-DD" the RRULE counts from (DTSTART date part). */
  anchorDate: string;
  /** 1..4 when this block is one dish in the 4-week rotation; for labelling only. */
  weekIndex?: number;
  notify?: NotifySpec | null;
  gatingNote?: string;
  /** True for no-phones family blocks — surfaced prominently in the UI. */
  noPhone?: boolean;
  /** True for all-day markers (laundry week, Sunday home-day) — no time row. */
  marker?: boolean;
  /** Swap-eligible blocks whose owner can change at the Weekly Reset. */
  swap?: 'wednesday_refresh' | 'morning_ahana' | 'laundry';
  runbook: Runbook;
}

/** A single materialised occurrence of a routine on a specific local date. */
export interface Occurrence {
  routine: Routine;
  /** Local date "YYYY-MM-DD". */
  date: string;
  startLocal: string;
  endLocal: string;
  /** Minutes from local midnight, for sorting/current-block detection. */
  startMinutes: number;
  endMinutes: number;
  /** Owner after applying any Weekly Reset swap decision for this week. */
  effectiveOwner: PersonKey;
}

export type CompletionStatus = 'done' | 'skipped';

export interface Completion {
  routineId: string;
  occurrenceDate: string;
  personKey: PersonKey;
  status: CompletionStatus;
  ts: string;
}

export interface WeeklyDecision {
  weekStart: string; // Monday "YYYY-MM-DD"
  wednesdayRefreshOwner?: PersonKey;
  prakashMorningDays?: string[]; // e.g. ["MO","TH"]
  laundryOwner?: PersonKey;
  notes?: string;
}

export interface RampConfig {
  personKey: PersonKey;
  type: 'bedtime';
  startDate: string; // "YYYY-MM-DD" the ramp began
  startTime: string; // "HH:mm" bedtime on startDate
  targetTime: string; // "HH:mm" end-state bedtime
  stepMinutes: number; // shift size, e.g. 15
  stepDays: number; // shift every N nights, e.g. 3
}

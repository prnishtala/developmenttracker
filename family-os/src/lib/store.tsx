import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CompletionStatus, PersonKey, RampConfig, View, WeeklyDecision } from './types';
import { DEFAULT_RAMPS } from '@/data/seed';
import { HOUSEHOLD_ID, isSupabaseConfigured, supabase } from './supabase';
import { weekStart } from './time';

// A completion is keyed by routine + occurrence date + person.
const compKey = (routineId: string, date: string, person: PersonKey) =>
  `${routineId}|${date}|${person}`;

interface StoreValue {
  ready: boolean;
  view: View;
  setView: (v: View) => void;

  completions: Record<string, CompletionStatus>;
  toggleDone: (routineId: string, date: string, person: PersonKey) => void;
  isDone: (routineId: string, date: string, person: PersonKey) => boolean;

  decisions: WeeklyDecision[];
  decisionForWeek: (weekStartISO: string) => WeeklyDecision | undefined;
  setDecision: (d: WeeklyDecision) => void;

  captures: { id: string; text: string }[];
  addCapture: (text: string) => void;
  clearCaptures: () => void;

  ramps: RampConfig[];
  setRamp: (r: RampConfig) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const K = {
  view: 'fos.view',
  completions: 'fos.completions',
  decisions: 'fos.decisions',
  captures: 'fos.captures',
  ramps: 'fos.ramps'
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [view, setViewState] = useState<View>('prakash');
  const [completions, setCompletions] = useState<Record<string, CompletionStatus>>({});
  const [decisions, setDecisions] = useState<WeeklyDecision[]>([]);
  const [captures, setCaptures] = useState<{ id: string; text: string }[]>([]);
  const [ramps, setRamps] = useState<RampConfig[]>(DEFAULT_RAMPS);

  // Initial load: local cache first (instant), then Supabase if configured.
  useEffect(() => {
    (async () => {
      try {
        const [v, c, d, cap, rmp] = await Promise.all([
          AsyncStorage.getItem(K.view),
          AsyncStorage.getItem(K.completions),
          AsyncStorage.getItem(K.decisions),
          AsyncStorage.getItem(K.captures),
          AsyncStorage.getItem(K.ramps)
        ]);
        if (v === 'prakash' || v === 'shraddha' || v === 'family') setViewState(v);
        if (c) setCompletions(JSON.parse(c));
        if (d) setDecisions(JSON.parse(d));
        if (cap) setCaptures(JSON.parse(cap));
        if (rmp) setRamps(JSON.parse(rmp));
      } catch {
        // ignore corrupt cache
      }
      if (isSupabaseConfigured && supabase) {
        await hydrateFromSupabase(setCompletions, setDecisions, setCaptures);
      }
      setReady(true);
    })();
  }, []);

  const setView = useCallback((v: View) => {
    setViewState(v);
    AsyncStorage.setItem(K.view, v).catch(() => {});
  }, []);

  const toggleDone = useCallback(
    (routineId: string, date: string, person: PersonKey) => {
      setCompletions((prev) => {
        const key = compKey(routineId, date, person);
        const next = { ...prev };
        const nowDone = !next[key];
        if (nowDone) next[key] = 'done';
        else delete next[key];
        AsyncStorage.setItem(K.completions, JSON.stringify(next)).catch(() => {});
        if (isSupabaseConfigured && supabase) {
          if (nowDone) {
            supabase
              .from('completions')
              .upsert(
                {
                  household_id: HOUSEHOLD_ID,
                  routine_id: routineId,
                  occurrence_date: date,
                  person_key: person,
                  status: 'done'
                },
                { onConflict: 'household_id,routine_id,occurrence_date,person_key' }
              )
              .then(() => {});
          } else {
            supabase
              .from('completions')
              .delete()
              .match({
                household_id: HOUSEHOLD_ID,
                routine_id: routineId,
                occurrence_date: date,
                person_key: person
              })
              .then(() => {});
          }
        }
        return next;
      });
    },
    []
  );

  const isDone = useCallback(
    (routineId: string, date: string, person: PersonKey) =>
      completions[compKey(routineId, date, person)] === 'done',
    [completions]
  );

  const decisionForWeek = useCallback(
    (weekStartISO: string) => decisions.find((d) => d.weekStart === weekStartISO),
    [decisions]
  );

  const setDecision = useCallback((d: WeeklyDecision) => {
    setDecisions((prev) => {
      const next = [...prev.filter((x) => x.weekStart !== d.weekStart), d];
      AsyncStorage.setItem(K.decisions, JSON.stringify(next)).catch(() => {});
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('weekly_decisions')
          .upsert(
            {
              household_id: HOUSEHOLD_ID,
              week_start: d.weekStart,
              wednesday_refresh_owner: d.wednesdayRefreshOwner ?? null,
              prakash_morning_days: d.prakashMorningDays ?? [],
              laundry_owner: d.laundryOwner ?? null,
              notes: d.notes ?? null
            },
            { onConflict: 'household_id,week_start' }
          )
          .then(() => {});
      }
      return next;
    });
  }, []);

  const addCapture = useCallback((text: string) => {
    const item = { id: `${Date.now()}`, text: text.trim() };
    if (!item.text) return;
    setCaptures((prev) => {
      const next = [item, ...prev];
      AsyncStorage.setItem(K.captures, JSON.stringify(next)).catch(() => {});
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('capture_notes')
          .insert({ household_id: HOUSEHOLD_ID, person_key: 'prakash', text: item.text })
          .then(() => {});
      }
      return next;
    });
  }, []);

  const clearCaptures = useCallback(() => {
    setCaptures([]);
    AsyncStorage.setItem(K.captures, JSON.stringify([])).catch(() => {});
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('capture_notes')
        .update({ cleared_at: new Date().toISOString() })
        .is('cleared_at', null)
        .then(() => {});
    }
  }, []);

  const setRamp = useCallback((r: RampConfig) => {
    setRamps((prev) => {
      const next = [...prev.filter((x) => x.personKey !== r.personKey || x.type !== r.type), r];
      AsyncStorage.setItem(K.ramps, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      view,
      setView,
      completions,
      toggleDone,
      isDone,
      decisions,
      decisionForWeek,
      setDecision,
      captures,
      addCapture,
      clearCaptures,
      ramps,
      setRamp
    }),
    [ready, view, completions, decisions, captures, ramps, setView, toggleDone, isDone, decisionForWeek, setDecision, addCapture, clearCaptures, setRamp]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

/** Convenience: this week's decision for a given local date. */
export function useDecisionForDate(dateISO: string) {
  const { decisionForWeek } = useStore();
  return decisionForWeek(weekStart(dateISO));
}

async function hydrateFromSupabase(
  setCompletions: React.Dispatch<React.SetStateAction<Record<string, CompletionStatus>>>,
  setDecisions: React.Dispatch<React.SetStateAction<WeeklyDecision[]>>,
  setCaptures: React.Dispatch<React.SetStateAction<{ id: string; text: string }[]>>
) {
  if (!supabase) return;
  try {
    const { data: comps } = await supabase
      .from('completions')
      .select('routine_id, occurrence_date, person_key, status');
    if (comps) {
      const map: Record<string, CompletionStatus> = {};
      for (const c of comps) {
        map[compKey(c.routine_id, c.occurrence_date, c.person_key as PersonKey)] =
          c.status as CompletionStatus;
      }
      setCompletions(map);
    }
    const { data: decs } = await supabase
      .from('weekly_decisions')
      .select('week_start, wednesday_refresh_owner, prakash_morning_days, laundry_owner, notes');
    if (decs) {
      setDecisions(
        decs.map((d) => ({
          weekStart: d.week_start,
          wednesdayRefreshOwner: d.wednesday_refresh_owner ?? undefined,
          prakashMorningDays: d.prakash_morning_days ?? [],
          laundryOwner: d.laundry_owner ?? undefined,
          notes: d.notes ?? undefined
        }))
      );
    }
    const { data: caps } = await supabase
      .from('capture_notes')
      .select('id, text')
      .is('cleared_at', null)
      .order('created_at', { ascending: false });
    if (caps) setCaptures(caps.map((c) => ({ id: String(c.id), text: c.text })));
  } catch {
    // offline — keep local cache
  }
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEAL_TYPES, QUANTITY_OPTIONS, VITAMIN_C_FRUITS } from '@/lib/constants';
import { CareLog } from '@/lib/types';

type PlannedActivity = { id: string; name: string };

type VoiceRecapProps = {
  date: string;
  plannedActivities: PlannedActivity[];
  onApplyMeal: (payload: { mealType: string; hadMeal: boolean; quantity: string | null; mealNotes: string | null }) => void;
  onApplyCare: (changes: Partial<CareLog>) => void;
  onAddNap: (values: { startTime: string; endTime: string | null }) => void;
  onCompleteActivity: (activityId: string) => void;
  onAppendDayNote: (text: string) => void;
};

type Phase = 'idle' | 'recording' | 'processing' | 'review';
type DraftMeal = { id: string; mealType: string; mealNotes: string; quantity: string };
type DraftNap = { id: string; startTime: string; endTime: string };
type DraftCare = { ironDrops: boolean; multivitamin: boolean; vitaminC: boolean; vitaminCFruit: string | null; bath: boolean };
type DraftActivity = { id: string; matchedId: string | null; name: string; completed: boolean };

const MAX_SECONDS = 150;
const uid = () => crypto.randomUUID();

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'].find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

export function VoiceRecap({ date, plannedActivities, onApplyMeal, onApplyCare, onAddNap, onCompleteActivity, onAppendDayNote }: VoiceRecapProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [meals, setMeals] = useState<DraftMeal[]>([]);
  const [naps, setNaps] = useState<DraftNap[]>([]);
  const [care, setCare] = useState<DraftCare>({ ironDrops: false, multivitamin: false, vitaminC: false, vitaminCFruit: null, bath: false });
  const [acts, setActs] = useState<DraftActivity[]>([]);
  const [misc, setMisc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const matchActivity = useCallback(
    (name: string): string | null => {
      const lower = name.toLowerCase();
      const found = plannedActivities.find((a) => a.name.toLowerCase() === lower || a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase()));
      return found?.id ?? null;
    },
    [plannedActivities]
  );

  const applyRecap = useCallback(
    (recap: {
      meals?: { mealType: string; mealNotes: string; quantity: string }[];
      naps?: { startTime: string | null; endTime: string | null }[];
      care?: Partial<DraftCare>;
      activities?: { name: string; completed: boolean }[];
      misc?: string;
    }) => {
      setMeals((recap.meals ?? []).map((m) => ({ id: uid(), ...m })));
      setNaps((recap.naps ?? []).map((n) => ({ id: uid(), startTime: n.startTime ?? '', endTime: n.endTime ?? '' })));
      setCare({
        ironDrops: Boolean(recap.care?.ironDrops),
        multivitamin: Boolean(recap.care?.multivitamin),
        vitaminC: Boolean(recap.care?.vitaminC),
        vitaminCFruit: recap.care?.vitaminCFruit ?? null,
        bath: Boolean(recap.care?.bath)
      });
      setActs((recap.activities ?? []).map((a) => ({ id: uid(), matchedId: matchActivity(a.name), name: a.name, completed: a.completed })));
      setMisc(recap.misc ?? '');
    },
    [matchActivity]
  );

  const upload = useCallback(
    async (blob: Blob) => {
      setPhase('processing');
      setError(null);
      try {
        const form = new FormData();
        form.append('audio', blob, 'recap');
        form.append('date', date);
        const res = await fetch('/api/voice-recap', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok || data?.ok === false || !data?.transcript) {
          setManual(true);
          setPhase('review');
          setTranscript('');
          setError((data?.reason || 'Could not read that recording. Type the recap and tap Extract.') + (data?.detail ? `\n(Details: ${data.detail})` : ''));
          return;
        }
        setTranscript(data.transcript);
        applyRecap(data.recap ?? {});
        setPhase('review');
      } catch {
        setManual(true);
        setPhase('review');
        setError('Something went wrong reaching the server. Type the recap and tap Extract.');
      }
    },
    [applyRecap, date]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setNote(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setManual(true);
      setPhase('review');
      setError('Recording is not supported here. Type the recap instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanup();
        void upload(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setSeconds((v) => {
          if (v + 1 >= MAX_SECONDS && recorder.state !== 'inactive') recorder.stop();
          return v + 1;
        });
      }, 1000);
    } catch {
      cleanup();
      setManual(true);
      setPhase('review');
      setError('Microphone access was blocked. Allow the mic, or type the recap below.');
    }
  }, [cleanup, upload]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop();
  }, []);

  const reExtract = useCallback(async () => {
    if (!transcript.trim()) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/extract-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, date })
      });
      const data = await res.json();
      if (res.ok && data?.recap) applyRecap(data.recap);
      else setError('Could not extract. Edit and try again.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }, [transcript, date, applyRecap]);

  function reset() {
    setPhase('idle');
    setTranscript('');
    setMeals([]);
    setNaps([]);
    setCare({ ironDrops: false, multivitamin: false, vitaminC: false, vitaminCFruit: null, bath: false });
    setActs([]);
    setMisc('');
    setError(null);
    setManual(false);
    setSeconds(0);
  }

  function applyAll() {
    let count = 0;
    meals.filter((m) => m.mealType.trim() && m.mealNotes.trim()).forEach((m) => {
      onApplyMeal({ mealType: m.mealType.trim(), hadMeal: true, quantity: m.quantity || 'Normal', mealNotes: m.mealNotes.trim() });
      count += 1;
    });
    naps.filter((n) => n.startTime).forEach((n) => {
      onAddNap({ startTime: n.startTime, endTime: n.endTime || null });
      count += 1;
    });
    const careChanges: Partial<CareLog> = {};
    if (care.ironDrops) careChanges.iron_drops = true;
    if (care.multivitamin) careChanges.multivitamin_drops = true;
    if (care.vitaminC) {
      careChanges.vitamin_c_given = true;
      if (care.vitaminCFruit) careChanges.vitamin_c_fruit = care.vitaminCFruit;
    }
    if (care.bath) careChanges.bath_completed = true;
    if (Object.keys(careChanges).length > 0) {
      onApplyCare(careChanges);
      count += 1;
    }
    acts.filter((a) => a.completed && a.matchedId).forEach((a) => {
      onCompleteActivity(a.matchedId as string);
      count += 1;
    });
    // Nothing gets dropped: misc + any activities not in today's plan go to day notes.
    const offPlan = acts.filter((a) => !a.matchedId).map((a) => `Activity: ${a.name}`);
    const miscFull = [misc.trim(), ...offPlan].filter(Boolean).join('\n');
    if (miscFull) {
      onAppendDayNote(miscFull);
      count += 1;
    }
    reset();
    setOpen(true);
    setNote(`Logged ${count} item${count === 1 ? '' : 's'} across the day. Check each tab to fine-tune.`);
  }

  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  const hasAnything = meals.length > 0 || naps.length > 0 || acts.length > 0 || care.ironDrops || care.multivitamin || care.vitaminC || care.bath || misc.trim().length > 0;

  return (
    <section className="futuristic-panel overflow-hidden p-4 sm:p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">🗣️</span>
          <div>
            <p className="text-sm font-semibold text-white">Recap the whole day by voice</p>
            <p className="text-xs text-slate-400">One note → meals, naps, care &amp; activities, all at once.</p>
          </div>
        </div>
        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3">
          {phase === 'idle' && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startRecording} className="futuristic-button bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950">● Record recap</button>
              <button type="button" onClick={() => { setManual(true); setPhase('review'); }} className="futuristic-button border border-white/10 bg-white/5 px-4 text-slate-200">Type instead</button>
            </div>
          )}

          {phase === 'recording' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-rose-200"><span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />Recording {mins}:{secs}</span>
              <button type="button" onClick={stopRecording} className="futuristic-button bg-gradient-to-r from-rose-400 to-amber-300 px-4 text-slate-950">■ Stop &amp; process</button>
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex items-center gap-2 text-sm text-cyan-100"><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-200/40 border-t-cyan-200" />Transcribing the whole day…</div>
          )}

          {phase === 'review' && (
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-cyan-100/90">
                {manual ? 'Type the day recap' : 'Transcript (edit if needed)'}
                <textarea rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="e.g. Breakfast one egg and half paratha, napped 1 to 2:30, dal rice at lunch, gave iron drops and orange, did block stacking, bath in evening" className="min-h-[5rem] rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={reExtract} disabled={busy || !transcript.trim()} className="futuristic-button border border-cyan-300/30 bg-cyan-400/10 px-4 text-cyan-50 disabled:opacity-50">{busy ? 'Extracting…' : manual ? 'Extract' : 'Re-extract'}</button>
                <button type="button" onClick={reset} className="futuristic-button border border-white/10 bg-white/5 px-4 text-slate-200">Start over</button>
              </div>

              {meals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-cyan-50">Meals</p>
                  {meals.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex flex-wrap gap-2">
                        <input list="recap-slots" value={m.mealType} onChange={(e) => setMeals((c) => c.map((x) => (x.id === m.id ? { ...x, mealType: e.target.value } : x)))} className="futuristic-input h-9 min-w-[9rem] flex-1 !text-sm" placeholder="Meal" />
                        <select value={m.quantity} onChange={(e) => setMeals((c) => c.map((x) => (x.id === m.id ? { ...x, quantity: e.target.value } : x)))} className="futuristic-input h-9 !text-sm">{QUANTITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                        <button type="button" onClick={() => setMeals((c) => c.filter((x) => x.id !== m.id))} className="futuristic-button h-9 border border-white/10 bg-white/5 px-3 text-slate-300">✕</button>
                      </div>
                      <textarea rows={1} value={m.mealNotes} onChange={(e) => setMeals((c) => c.map((x) => (x.id === m.id ? { ...x, mealNotes: e.target.value } : x)))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-300/60" />
                    </div>
                  ))}
                </div>
              )}

              {naps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-cyan-50">Naps</p>
                  {naps.map((n) => (
                    <div key={n.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-sm">
                      <span className="text-slate-400">from</span>
                      <input type="time" value={n.startTime} onChange={(e) => setNaps((c) => c.map((x) => (x.id === n.id ? { ...x, startTime: e.target.value } : x)))} className="futuristic-input h-9 !text-sm" />
                      <span className="text-slate-400">to</span>
                      <input type="time" value={n.endTime} onChange={(e) => setNaps((c) => c.map((x) => (x.id === n.id ? { ...x, endTime: e.target.value } : x)))} className="futuristic-input h-9 !text-sm" />
                      <button type="button" onClick={() => setNaps((c) => c.filter((x) => x.id !== n.id))} className="futuristic-button h-9 border border-white/10 bg-white/5 px-3 text-slate-300">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-cyan-50">Care</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {([['ironDrops', 'Iron drops'], ['multivitamin', 'Multivitamin'], ['vitaminC', 'Vitamin C'], ['bath', 'Bath']] as [keyof DraftCare, string][]).map(([k, label]) => (
                    <button key={k as string} type="button" onClick={() => setCare((c) => ({ ...c, [k]: !c[k] }))} className={`rounded-full border px-3 py-1 font-medium transition ${care[k] ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                      {care[k] ? '✓ ' : ''}{label}
                    </button>
                  ))}
                  {care.vitaminC && (
                    <select value={care.vitaminCFruit ?? ''} onChange={(e) => setCare((c) => ({ ...c, vitaminCFruit: e.target.value || null }))} className="futuristic-input h-8 !text-xs">
                      <option value="">C fruit…</option>
                      {VITAMIN_C_FRUITS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {acts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-cyan-50">Activities</p>
                  {acts.map((a) => (
                    <label key={a.id} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${a.matchedId ? 'border-white/10 bg-white/5 text-slate-100' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                      <input type="checkbox" checked={a.completed && Boolean(a.matchedId)} disabled={!a.matchedId} onChange={(e) => setActs((c) => c.map((x) => (x.id === a.id ? { ...x, completed: e.target.checked } : x)))} className="h-4 w-4 accent-cyan-400" />
                      <span className="flex-1">{a.name}</span>
                      {!a.matchedId && <span className="text-[10px] uppercase tracking-wide text-slate-500">not in today&apos;s plan</span>}
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-cyan-50">Anything else <span className="font-normal text-slate-400">(saved to day notes)</span></p>
                <textarea
                  rows={2}
                  value={misc}
                  onChange={(e) => setMisc(e.target.value)}
                  placeholder="Extra snacks, mood, health, outings, off-plan activities…"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <button type="button" onClick={applyAll} disabled={!hasAnything} className="futuristic-button w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 disabled:opacity-50">Save the whole day</button>
            </div>
          )}

          <datalist id="recap-slots">{MEAL_TYPES.map((m) => <option key={m} value={m} />)}</datalist>
          {error && <p className="mt-2 whitespace-pre-line break-words text-xs text-amber-200">{error}</p>}
          {note && <p className="mt-2 text-xs text-emerald-200">{note}</p>}
        </div>
      )}
    </section>
  );
}

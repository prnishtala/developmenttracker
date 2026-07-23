'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEAL_TYPES, QUANTITY_OPTIONS } from '@/lib/constants';

type DraftMeal = { id: string; mealType: string; mealNotes: string; quantity: string };

type VoiceMealLoggerProps = {
  onApply: (payload: { mealType: string; hadMeal: boolean; quantity: string | null; mealNotes: string | null }) => void;
};

type Phase = 'idle' | 'recording' | 'processing' | 'review';

const MAX_SECONDS = 120;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
}

function withId(meals: { mealType: string; mealNotes: string; quantity: string }[]): DraftMeal[] {
  return meals.map((meal) => ({ id: crypto.randomUUID(), ...meal }));
}

export function VoiceMealLogger({ onApply }: VoiceMealLoggerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [meals, setMeals] = useState<DraftMeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [reExtracting, setReExtracting] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const uploadAudio = useCallback(async (blob: Blob) => {
    setPhase('processing');
    setError(null);
    try {
      const form = new FormData();
      form.append('audio', blob, 'note');
      const res = await fetch('/api/voice-log', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data?.ok === false || !data?.transcript) {
        setTranscript('');
        setMeals([]);
        setManualMode(true);
        setPhase('review');
        setError(data?.reason || 'Could not read that recording. Type what she ate and tap Extract.');
        return;
      }
      setTranscript(data.transcript);
      setMeals(withId(Array.isArray(data.meals) ? data.meals : []));
      setPhase('review');
      if (!data.meals?.length) {
        setNote('Heard the note, but couldn\'t pull out meals. Edit the text and tap Re-extract, or add rows below.');
      }
    } catch {
      setManualMode(true);
      setPhase('review');
      setError('Something went wrong reaching the server. Type the note and tap Extract.');
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setNote(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setManualMode(true);
      setPhase('review');
      setError('Recording is not supported on this browser. Type the note instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanupStream();
        void uploadAudio(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= MAX_SECONDS) {
            try {
              recorder.state !== 'inactive' && recorder.stop();
            } catch {
              /* noop */
            }
          }
          return value + 1;
        });
      }, 1000);
    } catch {
      cleanupStream();
      setManualMode(true);
      setPhase('review');
      setError('Microphone access was blocked. Allow the mic, or type the note below.');
    }
  }, [cleanupStream, uploadAudio]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const reExtract = useCallback(async () => {
    if (!transcript.trim()) return;
    setReExtracting(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch('/api/extract-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.meals)) {
        setMeals(withId(data.meals));
        if (!data.meals.length) setNote('No meals found in that text. Add rows manually below.');
      } else {
        setError('Could not extract meals. You can still add rows manually.');
      }
    } catch {
      setError('Could not reach the server. Add rows manually below.');
    } finally {
      setReExtracting(false);
    }
  }, [transcript]);

  function updateMeal(id: string, patch: Partial<DraftMeal>) {
    setMeals((current) => current.map((meal) => (meal.id === id ? { ...meal, ...patch } : meal)));
  }
  function removeMeal(id: string) {
    setMeals((current) => current.filter((meal) => meal.id !== id));
  }
  function addMeal() {
    setMeals((current) => [...current, { id: crypto.randomUUID(), mealType: 'Breakfast', mealNotes: '', quantity: 'Normal' }]);
  }

  function reset() {
    setPhase('idle');
    setTranscript('');
    setMeals([]);
    setError(null);
    setNote(null);
    setManualMode(false);
    setSeconds(0);
  }

  function applyAll() {
    const usable = meals.filter((meal) => meal.mealType.trim() && meal.mealNotes.trim());
    usable.forEach((meal) => {
      onApply({ mealType: meal.mealType.trim(), hadMeal: true, quantity: meal.quantity || 'Normal', mealNotes: meal.mealNotes.trim() });
    });
    reset();
    setNote(`Logged ${usable.length} meal${usable.length === 1 ? '' : 's'} to today. Scroll down to fine-tune any slot.`);
  }

  const mins = String(Math.floor(seconds / 60)).padStart(1, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <section className="rounded-[22px] border border-cyan-300/25 bg-gradient-to-br from-cyan-400/10 to-emerald-400/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-cyan-50">Log by voice</p>
          <p className="mt-0.5 text-xs leading-5 text-cyan-100/80">
            Tap record and just say what she ate — after any meal, or one recap at the end of the day. We turn it into meal
            entries you can check before saving.
          </p>
        </div>
        <span aria-hidden className="text-2xl">🎙️</span>
      </div>

      {phase === 'idle' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="futuristic-button bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950"
          >
            ● Record a note
          </button>
          <button
            type="button"
            onClick={() => {
              setManualMode(true);
              setPhase('review');
              setTranscript('');
              setMeals([]);
            }}
            className="futuristic-button border border-white/10 bg-white/5 px-4 text-slate-200"
          >
            Type instead
          </button>
        </div>
      )}

      {phase === 'recording' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-200">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" />
            Recording {mins}:{secs}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="futuristic-button bg-gradient-to-r from-rose-400 to-amber-300 px-4 text-slate-950"
          >
            ■ Stop &amp; transcribe
          </button>
          <span className="text-[11px] text-cyan-100/70">Auto-stops at 2 min</span>
        </div>
      )}

      {phase === 'processing' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-cyan-100">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-200/40 border-t-cyan-200" />
          Transcribing and reading the meals…
        </div>
      )}

      {phase === 'review' && (
        <div className="mt-3 space-y-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-cyan-100/90">
            {manualMode ? 'Type what she ate' : 'Transcript (edit if needed)'}
            <textarea
              rows={3}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="e.g. Breakfast one egg and half paratha, mid morning banana, lunch dal rice with ghee and curd, refused dinner"
              className="min-h-[5rem] rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reExtract}
              disabled={reExtracting || !transcript.trim()}
              className="futuristic-button border border-cyan-300/30 bg-cyan-400/10 px-4 text-cyan-50 disabled:opacity-50"
            >
              {reExtracting ? 'Extracting…' : manualMode ? 'Extract meals' : 'Re-extract'}
            </button>
            <button type="button" onClick={reset} className="futuristic-button border border-white/10 bg-white/5 px-4 text-slate-200">
              Start over
            </button>
          </div>

          {meals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-cyan-50">Review before saving</p>
              {meals.map((meal) => (
                <div key={meal.id} className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex flex-wrap gap-2">
                    <input
                      list="voice-meal-slots"
                      value={meal.mealType}
                      onChange={(event) => updateMeal(meal.id, { mealType: event.target.value })}
                      className="futuristic-input h-9 min-w-[9rem] flex-1 !text-sm"
                      placeholder="Meal slot"
                    />
                    <select
                      value={meal.quantity}
                      onChange={(event) => updateMeal(meal.id, { quantity: event.target.value })}
                      className="futuristic-input h-9 !text-sm"
                    >
                      {QUANTITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMeal(meal.id)}
                      aria-label="Remove meal"
                      className="futuristic-button h-9 border border-white/10 bg-white/5 px-3 text-slate-300"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={meal.mealNotes}
                    onChange={(event) => updateMeal(meal.id, { mealNotes: event.target.value })}
                    placeholder="What she ate and how much"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addMeal} className="futuristic-button border border-white/10 bg-white/5 px-4 text-slate-200">
              + Add a meal
            </button>
            <button
              type="button"
              onClick={applyAll}
              disabled={!meals.some((meal) => meal.mealType.trim() && meal.mealNotes.trim())}
              className="futuristic-button bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950 disabled:opacity-50"
            >
              Save to today
            </button>
          </div>
        </div>
      )}

      <datalist id="voice-meal-slots">
        {MEAL_TYPES.map((meal) => (
          <option key={meal} value={meal} />
        ))}
      </datalist>

      {error && <p className="mt-2 text-xs text-amber-200">{error}</p>}
      {note && <p className="mt-2 text-xs text-emerald-200">{note}</p>}
    </section>
  );
}

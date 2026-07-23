'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { GrowthChart } from '@/components/GrowthChart';
import {
  ageInMonths,
  ageLabel,
  GROWTH_REFERENCE_NOTE,
  GrowthMetric,
  percentileBand
} from '@/lib/growth';
import {
  assessDomain,
  DOMAIN_ACTIVITY_SUGGESTIONS,
  DOMAIN_LABELS,
  DOMAINS,
  MILESTONES,
  MilestoneDomain,
  MilestoneStatus,
  RED_FLAGS
} from '@/lib/milestones';
import { ChildProfile, GrowthMeasurement, MilestoneRecord } from '@/lib/types';

type Props = {
  today: string;
  initialProfile: ChildProfile | null;
  initialGrowth: GrowthMeasurement[];
  initialMilestones: MilestoneRecord[];
};

const STATUS_LABEL: Record<MilestoneStatus, string> = { not_yet: 'Not yet', emerging: 'Emerging', achieved: 'Done' };
const STATUS_ORDER: MilestoneStatus[] = ['not_yet', 'emerging', 'achieved'];

const DOMAIN_TONE: Record<string, string> = {
  on_track: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  emerging: 'border-amber-300/30 bg-amber-400/10 text-amber-200',
  watch: 'border-rose-300/30 bg-rose-400/10 text-rose-200'
};
const DOMAIN_TONE_LABEL: Record<string, string> = { on_track: 'On track', emerging: 'Emerging', watch: 'Worth a look' };

function floatAgeMonths(birth: string, on: string): number {
  const b = new Date(`${birth}T00:00:00`).getTime();
  const o = new Date(`${on}T00:00:00`).getTime();
  if (Number.isNaN(b) || Number.isNaN(o)) return 0;
  return Math.max(0, (o - b) / (1000 * 60 * 60 * 24) / 30.4375);
}

export function GrowthMilestonesClient({ today, initialProfile, initialGrowth, initialMilestones }: Props) {
  const [profile, setProfile] = useState<ChildProfile | null>(initialProfile);
  const [growth, setGrowth] = useState<GrowthMeasurement[]>(initialGrowth);
  const [statusByKey, setStatusByKey] = useState<Map<string, MilestoneStatus>>(
    new Map(initialMilestones.map((r) => [r.milestone_key, r.status]))
  );
  const [metric, setMetric] = useState<GrowthMetric>('weight');
  const [birthDateDraft, setBirthDateDraft] = useState(initialProfile?.birth_date ?? '');
  const [sexDraft, setSexDraft] = useState<'female' | 'male'>(initialProfile?.sex ?? 'female');
  const [savingProfile, setSavingProfile] = useState(false);

  const [mDate, setMDate] = useState(today);
  const [mWeight, setMWeight] = useState('');
  const [mHeight, setMHeight] = useState('');
  const [mHead, setMHead] = useState('');
  const [savingM, setSavingM] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const birthDate = profile?.birth_date ?? null;
  const currentAge = birthDate ? ageInMonths(birthDate, today) : null;

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/child-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate: birthDateDraft || null, sex: sexDraft })
      });
      if (res.ok) {
        setProfile((p) => ({
          id: p?.id ?? '',
          name: p?.name ?? 'Ahana',
          birth_date: birthDateDraft || null,
          sex: sexDraft
        }));
      }
    } finally {
      setSavingProfile(false);
    }
  }, [birthDateDraft, sexDraft]);

  const addMeasurement = useCallback(async () => {
    setFormError(null);
    if (!mWeight && !mHeight && !mHead) {
      setFormError('Enter at least a weight or height.');
      return;
    }
    setSavingM(true);
    const optimistic: GrowthMeasurement = {
      id: `temp-${mDate}`,
      measured_on: mDate,
      weight_kg: mWeight ? Number(mWeight) : null,
      height_cm: mHeight ? Number(mHeight) : null,
      head_circumference_cm: mHead ? Number(mHead) : null,
      notes: null
    };
    const previous = growth;
    setGrowth((cur) => [...cur.filter((g) => g.measured_on !== mDate), optimistic].sort((a, b) => (a.measured_on < b.measured_on ? -1 : 1)));
    try {
      const res = await fetch('/api/growth-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measuredOn: mDate, weightKg: mWeight, heightCm: mHeight, headCircumferenceCm: mHead })
      });
      if (!res.ok) {
        setGrowth(previous);
        const data = await res.json().catch(() => ({}));
        setFormError(data?.error || 'Could not save. Try again.');
      } else {
        setMWeight('');
        setMHeight('');
        setMHead('');
      }
    } catch {
      setGrowth(previous);
      setFormError('Could not reach the server.');
    } finally {
      setSavingM(false);
    }
  }, [growth, mDate, mWeight, mHeight, mHead]);

  const deleteMeasurement = useCallback(
    async (m: GrowthMeasurement) => {
      const previous = growth;
      setGrowth((cur) => cur.filter((g) => g.id !== m.id));
      try {
        await fetch('/api/growth-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: m.id })
        });
      } catch {
        setGrowth(previous);
      }
    },
    [growth]
  );

  const setMilestone = useCallback(async (key: string, status: MilestoneStatus) => {
    const previous = new Map(statusByKey);
    setStatusByKey((cur) => new Map(cur).set(key, status));
    try {
      const res = await fetch('/api/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneKey: key, status })
      });
      if (!res.ok) setStatusByKey(previous);
    } catch {
      setStatusByKey(previous);
    }
  }, [statusByKey]);

  const chartPoints = useMemo(() => {
    if (!birthDate) return [];
    return growth
      .map((g) => ({ age: floatAgeMonths(birthDate, g.measured_on), value: metric === 'weight' ? g.weight_kg : g.height_cm }))
      .filter((p): p is { age: number; value: number } => typeof p.value === 'number' && p.value > 0)
      .sort((a, b) => a.age - b.age);
  }, [growth, birthDate, metric]);

  const maxAge = useMemo(() => {
    const fromData = chartPoints.length ? Math.max(...chartPoints.map((p) => p.age)) : 0;
    return Math.min(60, Math.ceil(Math.max(36, (currentAge ?? 0) + 3, fromData + 2)));
  }, [chartPoints, currentAge]);

  const latest = useMemo(() => growth[growth.length - 1] ?? null, [growth]);
  const latestAge = latest && birthDate ? floatAgeMonths(birthDate, latest.measured_on) : null;

  return (
    <div className="space-y-6">
      <header className="futuristic-panel p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Growth &amp; milestones</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
          {profile?.name ?? 'Ahana'}
          {currentAge !== null && <span className="ml-2 text-lg font-normal text-slate-400">· {ageLabel(currentAge)}</span>}
        </h1>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
            Birth date
            <input type="date" value={birthDateDraft} max={today} onChange={(e) => setBirthDateDraft(e.target.value)} className="futuristic-input h-10" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
            Sex (for growth reference)
            <select value={sexDraft} onChange={(e) => setSexDraft(e.target.value as 'female' | 'male')} className="futuristic-input h-10">
              <option value="female">Girl</option>
              <option value="male">Boy</option>
            </select>
          </label>
          <button type="button" onClick={saveProfile} disabled={savingProfile} className="futuristic-button h-10 bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950 disabled:opacity-50">
            {savingProfile ? 'Saving…' : 'Save'}
          </button>
        </div>
        {!birthDate && <p className="mt-2 text-xs text-amber-200">Set her birth date so the growth curve and milestones use her exact age.</p>}
      </header>

      {/* GROWTH */}
      <section className="futuristic-panel p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Growth</h2>
          <div className="flex gap-1">
            {(['weight', 'height'] as GrowthMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`h-8 rounded-xl px-3 text-xs font-semibold capitalize transition ${metric === m ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {sexDraft === 'male' && <p className="mt-1 text-[11px] text-amber-200">Reference band shown is the WHO girls standard; boys&apos; band isn&apos;t loaded yet.</p>}

        {birthDate ? (
          <>
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-2">
              <GrowthChart metric={metric} unit={metric === 'weight' ? 'kg' : 'cm'} points={chartPoints} maxAge={maxAge} />
            </div>
            {latest && latestAge !== null && (
              <p className="mt-2 text-sm text-slate-300">
                Latest ({latest.measured_on}):{' '}
                {latest.weight_kg ? <b className="text-white">{latest.weight_kg} kg</b> : null}
                {latest.weight_kg && latest.height_cm ? ' · ' : ''}
                {latest.height_cm ? <b className="text-white">{latest.height_cm} cm</b> : null}
                {metric === 'weight' && latest.weight_kg ? ` — ${percentileBand('weight', latestAge, latest.weight_kg)}` : null}
                {metric === 'height' && latest.height_cm ? ` — ${percentileBand('height', latestAge, latest.height_cm)}` : null}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500">{GROWTH_REFERENCE_NOTE}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Add her birth date above to plot the curve.</p>
        )}

        {/* add measurement */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">Add a measurement</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">Date
              <input type="date" value={mDate} max={today} onChange={(e) => setMDate(e.target.value)} className="futuristic-input h-9 !text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">Weight (kg)
              <input type="number" inputMode="decimal" step="0.01" value={mWeight} onChange={(e) => setMWeight(e.target.value)} className="futuristic-input h-9 !text-sm" placeholder="10.2" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">Height (cm)
              <input type="number" inputMode="decimal" step="0.1" value={mHeight} onChange={(e) => setMHeight(e.target.value)} className="futuristic-input h-9 !text-sm" placeholder="80.5" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">Head (cm)
              <input type="number" inputMode="decimal" step="0.1" value={mHead} onChange={(e) => setMHead(e.target.value)} className="futuristic-input h-9 !text-sm" placeholder="opt." />
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={addMeasurement} disabled={savingM} className="futuristic-button h-9 bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-slate-950 disabled:opacity-50">
              {savingM ? 'Saving…' : 'Add'}
            </button>
            {formError && <span className="text-xs text-amber-200">{formError}</span>}
          </div>
        </div>

        {growth.length > 0 && (
          <div className="mt-3 space-y-1">
            {growth.slice().reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
                <span className="text-slate-400">{m.measured_on}</span>
                <span className="flex-1 text-right">
                  {[m.weight_kg ? `${m.weight_kg} kg` : null, m.height_cm ? `${m.height_cm} cm` : null, m.head_circumference_cm ? `${m.head_circumference_cm} cm head` : null].filter(Boolean).join(' · ')}
                </span>
                <button type="button" onClick={() => deleteMeasurement(m)} aria-label="Delete" className="text-slate-500 hover:text-rose-300">✕</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MILESTONES */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Milestones</h2>
          <span className="text-xs text-slate-400">Tap Not yet · Emerging · Done</span>
        </div>
        {currentAge === null && <p className="text-sm text-amber-200">Set her birth date to see which milestones are due.</p>}

        {DOMAINS.map((domain: MilestoneDomain) => {
          const assessment = assessDomain(domain, statusByKey, currentAge ?? 999);
          const items = MILESTONES.filter((m) => m.domain === domain && m.byMonths <= (currentAge ?? 24) + 6).sort((a, b) => a.byMonths - b.byMonths);
          const showSuggestions = currentAge !== null && (assessment.status === 'watch' || assessment.status === 'emerging');
          return (
            <div key={domain} className="futuristic-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{DOMAIN_LABELS[domain]}</h3>
                {currentAge !== null && (
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${DOMAIN_TONE[assessment.status]}`}>
                    {DOMAIN_TONE_LABEL[assessment.status]}
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1.5">
                {items.map((m) => {
                  const status = statusByKey.get(m.key) ?? 'not_yet';
                  const due = currentAge !== null && m.byMonths <= currentAge;
                  return (
                    <div key={m.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-100">{m.text}</p>
                        <p className="text-[11px] text-slate-500">by ~{m.byMonths} mo{!due ? ' · upcoming' : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_ORDER.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMilestone(m.key, s)}
                            className={`h-7 rounded-lg px-2 text-[11px] font-semibold transition ${
                              status === s
                                ? s === 'achieved'
                                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950'
                                  : s === 'emerging'
                                    ? 'bg-amber-400/80 text-slate-950'
                                    : 'bg-white/20 text-white'
                                : 'border border-white/10 bg-white/5 text-slate-300'
                            }`}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] leading-4 text-slate-400">{RED_FLAGS[domain]}</p>

              {showSuggestions && (
                <div className="mt-2 rounded-xl border border-amber-300/20 bg-amber-400/5 p-2.5">
                  <p className="text-xs font-semibold text-amber-100">Give this area a boost — try these activities:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {DOMAIN_ACTIVITY_SUGGESTIONS[domain].map((a) => (
                      <span key={a} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200">{a}</span>
                    ))}
                  </div>
                  <Link href="/" className="mt-1.5 inline-block text-[11px] font-semibold text-cyan-300 hover:text-cyan-200">Open Development activities →</Link>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <p className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
        Milestones and growth bands are general guidance, not a screening or diagnosis. Every child develops at their own
        pace — share any concerns, or a domain marked “worth a look,” with your pediatrician.
      </p>
    </div>
  );
}

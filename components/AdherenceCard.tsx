import Link from 'next/link';
import { DailyAdherence, PillarStatus } from '@/lib/nutrition-adherence';

const STATUS_ICON: Record<PillarStatus, string> = { met: '✓', partial: '◑', missing: '○' };
const STATUS_RING: Record<PillarStatus, string> = {
  met: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200',
  partial: 'border-amber-300/40 bg-amber-400/15 text-amber-200',
  missing: 'border-white/15 bg-white/5 text-slate-400'
};

function scoreTone(score: number): string {
  if (score >= 85) return 'from-emerald-400 to-cyan-400';
  if (score >= 55) return 'from-amber-300 to-emerald-400';
  return 'from-rose-400 to-amber-300';
}

export function AdherenceCard({ adherence }: { adherence: DailyAdherence }) {
  const { score, headline, pillars, metCount, totalCount, eggToday, milkServings } = adherence;

  return (
    <section className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Today vs. plan</p>
          <h3 className="mt-0.5 text-lg font-semibold text-white">{headline}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{metCount} of {totalCount} pillars on track</p>
        </div>
        <div className="flex flex-col items-center">
          <div className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br ${scoreTone(score)} text-slate-950`}>
            <span className="text-lg font-bold tabular-nums">{score}</span>
          </div>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">score</span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {pillars.map((pillar) => (
          <div key={pillar.key} className="flex items-start gap-2.5">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${STATUS_RING[pillar.status]}`}>
              {STATUS_ICON[pillar.status]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium text-slate-100">{pillar.label}</p>
                <p className="text-[11px] text-slate-400">{pillar.detail}</p>
              </div>
              {pillar.tip && <p className="text-xs leading-4 text-amber-200/90">{pillar.tip}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${eggToday ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
          {eggToday ? 'Egg ✓ today' : 'No egg yet'}
        </span>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${milkServings >= 3 ? 'border-amber-300/30 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
          Milk: {milkServings} logged{milkServings >= 3 ? ' · keep ≤ ~500 ml' : ''}
        </span>
        <Link href="/meal-plan" className="ml-auto text-xs font-semibold text-cyan-300 hover:text-cyan-200">
          View full plan →
        </Link>
      </div>
    </section>
  );
}

'use client';

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardData, DashboardTone } from '@/lib/types';

type DashboardChartsProps = {
  data: DashboardData;
};

const TONE_STYLES: Record<DashboardTone, string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  neutral: 'border-slate-200 bg-slate-50 text-slate-900',
  watch: 'border-amber-200 bg-amber-50 text-amber-900'
};

const TONE_BAR_STYLES: Record<DashboardTone, string> = {
  good: 'bg-emerald-500',
  neutral: 'bg-slate-500',
  watch: 'bg-amber-500'
};

const CHART_COLORS = {
  language: '#365314',
  motor: '#ea580c',
  calories: '#1d4ed8',
  meals: '#65a30d',
  naps: '#0f766e'
};

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function metricLabel(value: number, unit: string): string {
  return `${value}${unit}`;
}

function calculationSourceLabel(source: DashboardData['nutritionSnapshot']['calculationSource']): string {
  if (source === 'openai') return 'AI text parser';
  if (source === 'mixed') return 'AI + fallback parser';
  return 'Fallback parser';
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="relative overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,162,89,0.34),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(79,119,45,0.32),_transparent_30%)]" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Parent Summary</p>
                <h2 className="text-3xl font-semibold leading-tight">{data.narrative.headline}</h2>
                <p className="max-w-xl text-sm leading-6 text-slate-200">{data.narrative.summary}</p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                {data.narrative.source === 'openai' ? 'AI-assisted summary' : 'Rule-based summary'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">What Is Going Well</p>
                <div className="mt-3 space-y-2 text-sm text-slate-100">
                  {data.narrative.strengths.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Needs Attention</p>
                <div className="mt-3 space-y-2 text-sm text-slate-100">
                  {data.narrative.concerns.length > 0 ? (
                    data.narrative.concerns.map((item) => <p key={item}>{item}</p>)
                  ) : (
                    <p>No major concerns are standing out from the recent logs.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Data Quality</p>
              <p className="mt-2 text-sm text-slate-100">{data.narrative.dataQuality}</p>
            </div>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.summaryCards.map((card) => (
            <article
              key={card.label}
              className={`rounded-[26px] border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${TONE_STYLES[card.tone]}`}
            >
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-3 text-sm leading-6 opacity-90">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[30px] border border-white/60 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Nutrition Coverage</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">What she is getting vs. missing</h3>
              <p className="mt-2 text-sm text-slate-600">
                Nutrient values are estimated from the nanny&apos;s meal notes using {calculationSourceLabel(data.nutritionSnapshot.calculationSource)}.
              </p>
              {data.nutritionSnapshot.supplementIronMg > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  Iron totals include {data.nutritionSnapshot.supplementIronMg} mg from supplements across {data.nutritionSnapshot.supplementIronDays} care days.
                </p>
              )}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Latest meal log: {formatShortDate(data.nutritionSnapshot.latestDate)}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {data.nutritionSnapshot.coverage.map((item) => (
              <div key={item.nutrient} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.nutrient}</p>
                    <p className="text-xs text-slate-500">
                      Avg {metricLabel(item.estimated, item.unit)} vs target {metricLabel(item.target, item.unit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{item.coveragePercent}%</p>
                    <p className="text-xs text-slate-500">{item.daysMetTarget} target-hit days</p>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${TONE_BAR_STYLES[item.tone]}`}
                    style={{ width: `${Math.min(item.coveragePercent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Meal Days</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.nutritionSnapshot.daysWithMeals}/14</p>
              <p className="mt-1 text-xs text-slate-500">Days with at least one meal logged</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Full Days</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.nutritionSnapshot.fullyLoggedDays}</p>
              <p className="mt-1 text-xs text-slate-500">Days with all three meals captured</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Avg Meals</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.nutritionSnapshot.averageMealsPerDay}</p>
              <p className="mt-1 text-xs text-slate-500">Meals logged per day over the last 14 days</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recognized Meals</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.nutritionSnapshot.recognizableMealsPercent}%</p>
              <p className="mt-1 text-xs text-slate-500">Meals matched to known foods in notes</p>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] bg-[#102a20] p-6 text-white shadow-[0_24px_80px_rgba(16,42,32,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">What To Do Next</p>
          <h3 className="mt-2 text-2xl font-semibold">Actionable summary for the parent</h3>

          <div className="mt-6 space-y-3">
            {data.narrative.actions.map((action) => (
              <div key={action} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-100">
                {action}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] bg-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Nutrition Notes</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
              {data.nutritionSnapshot.insights.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Energy Trend</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Calories over the last 14 days</h3>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.calorieTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={formatShortDate} />
                <Line dataKey="calories" type="monotone" stroke={CHART_COLORS.calories} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Development Mix</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Language and motor minutes</h3>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.languageTrend.map((item, index) => ({
                  date: item.date,
                  language: item.minutes,
                  motor: data.motorTrend[index]?.minutes ?? 0
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={formatShortDate} />
                <Legend />
                <Line dataKey="language" name="Language" type="monotone" stroke={CHART_COLORS.language} strokeWidth={3} dot={false} />
                <Line dataKey="motor" name="Motor" type="monotone" stroke={CHART_COLORS.motor} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Meal Consistency</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Meals logged per day</h3>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mealCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} domain={[0, 3]} tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={formatShortDate} />
                <Bar dataKey="meals" fill={CHART_COLORS.meals} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Naps</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Total nap minutes per day</h3>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.napTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={formatShortDate} />
                <Line dataKey="totalMinutes" name="Nap minutes" type="monotone" stroke={CHART_COLORS.naps} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}

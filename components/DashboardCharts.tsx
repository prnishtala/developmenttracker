'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { DashboardData } from '@/lib/types';

type DashboardChartsProps = {
  data: DashboardData;
};

const PIE_COLORS = ['#4f772d', '#cbd5e1'];
const SUMMARY_COLORS = ['#4f772d', '#6f9f42', '#f4a259', '#3f3f46'];

export function DashboardCharts({ data }: DashboardChartsProps) {
  const activityPieData = [
    { name: 'Completed', value: data.completion.completed },
    { name: 'Missed', value: data.completion.missed }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Completed vs Missed (7 days)</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityPieData} dataKey="value" nameKey="name" outerRadius={100}>
                  {activityPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meal Diversity per Day</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.foodDiversity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f4a259" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Estimated Calories Trend (14 days)</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.calorieTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="calories" type="monotone" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Estimated Nutrients vs Target</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.nutritionSnapshot.comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nutrient" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimated" name="Estimated" fill="#16a34a" />
                <Bar dataKey="target" name="Target" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Nutrition Summary</p>
            {data.nutritionSnapshot.insights.map((insight) => (
              <p key={insight} className="text-sm text-slate-700">
                {insight}
              </p>
            ))}
          </div>
        </article>
      </section>

      <article className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Skill Minutes by Category (7 days)</h2>
        <div className="mt-2 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.skillMinutes} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={140} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#4f772d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Language Exposure Minutes</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.languageTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="minutes" type="monotone" stroke="#4f772d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Motor Exposure Minutes</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.motorTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="minutes" type="monotone" stroke="#f4a259" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meals Logged (Yes) Per Day</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mealCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} domain={[0, 3]} />
                <Tooltip />
                <Bar dataKey="meals" fill="#6f9f42" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Medicines & Care Summary (14 days)</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.medicineSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {data.medicineSummary.map((entry, index) => (
                    <Cell key={entry.label} fill={SUMMARY_COLORS[index % SUMMARY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Care Activities Count Per Day</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.careTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} domain={[0, 4]} />
                <Tooltip />
                <Line dataKey="careCount" type="monotone" stroke="#3f3f46" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nap Minutes and Nap Count</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.napTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="minutes" />
                <YAxis yAxisId="naps" orientation="right" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line yAxisId="minutes" dataKey="totalMinutes" type="monotone" stroke="#4f772d" strokeWidth={3} />
                <Line yAxisId="naps" dataKey="naps" type="monotone" stroke="#f4a259" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}

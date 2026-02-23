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

export function DashboardCharts({ data }: DashboardChartsProps) {
  const pieData = [
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
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                  {pieData.map((entry, index) => (
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
          <h2 className="text-lg font-semibold text-slate-900">Food Diversity per Day</h2>
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

      <article className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Language Exposure Minutes</h2>
        <div className="mt-2 h-80">
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

      <section className="rounded-2xl bg-white p-4 shadow-sm">
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
      </section>
    </div>
  );
}

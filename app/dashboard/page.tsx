import { unstable_noStore as noStore } from 'next/cache';
import { DashboardCharts } from '@/components/DashboardCharts';
import { getDashboardData } from '@/lib/data';

export default async function DashboardPage() {
  noStore();
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <header className="rounded-[30px] border border-white/60 bg-[linear-gradient(135deg,_rgba(248,243,233,0.95),_rgba(237,245,223,0.92))] p-6 shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Parent Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Insight-first view of meals, routines, and development</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This view turns the last 14 days of logs into a concise summary of what looks solid, what may need attention,
          and what to change next.
        </p>
      </header>
      <DashboardCharts data={data} />
    </div>
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { DashboardCharts } from '@/components/DashboardCharts';
import { getDashboardData } from '@/lib/data';

export default async function DashboardPage() {
  noStore();
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      <header className="rounded-2xl bg-brand-500 p-4 text-white">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <p className="text-sm opacity-90">Last 14 days of development, meals, care, and nap trends.</p>
      </header>
      <DashboardCharts data={data} />
    </div>
  );
}

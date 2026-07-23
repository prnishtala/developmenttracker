import { unstable_noStore as noStore } from 'next/cache';
import { format } from 'date-fns';
import { GrowthMilestonesClient } from '@/components/GrowthMilestonesClient';
import { getChildProfile, getGrowthMeasurements, getMilestoneRecords } from '@/lib/data';

export const metadata = { title: 'Growth & Milestones' };

export default async function GrowthPage() {
  noStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [profile, growth, milestones] = await Promise.all([
    getChildProfile(),
    getGrowthMeasurements(),
    getMilestoneRecords()
  ]);

  return (
    <div className="futuristic-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <GrowthMilestonesClient today={today} initialProfile={profile} initialGrowth={growth} initialMilestones={milestones} />
      </div>
    </div>
  );
}

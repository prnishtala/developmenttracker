import { unstable_noStore as noStore } from 'next/cache';
import { format } from 'date-fns';
import { HomeClient } from '@/components/HomeClient';
import { getActivitiesForDate, getFoodLogsForDate, getHomeInsights } from '@/lib/data';

export default async function HomePage() {
  noStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [activities, foodLogs, insights] = await Promise.all([
    getActivitiesForDate(today),
    getFoodLogsForDate(today),
    getHomeInsights()
  ]);

  return <HomeClient date={today} initialActivities={activities} initialFoods={foodLogs} insights={insights} />;
}

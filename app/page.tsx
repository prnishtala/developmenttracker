import { unstable_noStore as noStore } from 'next/cache';
import { format } from 'date-fns';
import { HomeClient } from '@/components/HomeClient';
import {
  getCareLogForDate,
  getHomeInsights,
  getNapLogsForDate,
  getNutritionLogsForDate,
  getPlannedActivitiesForDate
} from '@/lib/data';

export default async function HomePage() {
  noStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [activities, nutritionLogs, careLog, napLogs, insights] = await Promise.all([
    getPlannedActivitiesForDate(today),
    getNutritionLogsForDate(today),
    getCareLogForDate(today),
    getNapLogsForDate(today),
    getHomeInsights()
  ]);

  return (
    <HomeClient
      date={today}
      initialActivities={activities}
      initialNutritionLogs={nutritionLogs}
      initialCareLog={careLog}
      initialNapLogs={napLogs}
      insights={insights}
    />
  );
}

import { unstable_noStore as noStore } from 'next/cache';
import { format, parseISO, subDays } from 'date-fns';
import { HomeClient } from '@/components/HomeClient';
import { getDateInTimeZone, isDateWithinBackRange, normalizeTimeZone } from '@/lib/date';
import {
  getAdHocActivitiesForDate,
  getCareLogForDate,
  getDayNote,
  getHomeInsights,
  getNapLogsForDate,
  getNutritionLogsForDate,
  getPlannedActivitiesForDate
} from '@/lib/data';

type HomePageProps = {
  searchParams?: {
    date?: string;
    tz?: string;
  };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  noStore();

  const timeZone = normalizeTimeZone(searchParams?.tz);
  const today = getDateInTimeZone(new Date(), timeZone);
  const selectedDate = isDateWithinBackRange(searchParams?.date ?? '', today, 7) ? searchParams?.date ?? today : today;
  const minDate = format(subDays(parseISO(today), 7), 'yyyy-MM-dd');

  const [activities, adHocActivities, nutritionLogs, careLog, napLogs, insights, dayNote] = await Promise.all([
    getPlannedActivitiesForDate(selectedDate),
    getAdHocActivitiesForDate(selectedDate),
    getNutritionLogsForDate(selectedDate),
    getCareLogForDate(selectedDate),
    getNapLogsForDate(selectedDate),
    getHomeInsights(),
    getDayNote(selectedDate)
  ]);

  return (
    <HomeClient
      date={selectedDate}
      minDate={minDate}
      maxDate={today}
      timeZone={timeZone}
      initialActivities={activities}
      initialAdHocActivities={adHocActivities}
      initialNutritionLogs={nutritionLogs}
      initialCareLog={careLog}
      initialNapLogs={napLogs}
      insights={insights}
      initialDayNote={dayNote}
    />
  );
}

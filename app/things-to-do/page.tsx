import { unstable_noStore as noStore } from 'next/cache';
import { addDays, format } from 'date-fns';
import { ThingsToDoClient } from '@/components/ThingsToDoClient';
import { EVENTS_HORIZON_DAYS } from '@/lib/constants';
import { getEventsInWindow } from '@/lib/data';

export default async function ThingsToDoPage() {
  noStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const to = format(addDays(new Date(), EVENTS_HORIZON_DAYS - 1), 'yyyy-MM-dd');

  const events = await getEventsInWindow(today, to);

  return <ThingsToDoClient today={today} initialEvents={events} />;
}

import * as Notifications from 'expo-notifications';
import { DateTime } from 'luxon';
import { View, WeeklyDecision } from './types';
import { dayOccurrences } from './schedule';
import { TZ, todayLocal, addDaysISO, toMinutes } from './time';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * (Re)schedule block reminders for the next few days, following the plan's
 * guidance: reminders only where the routine declares a `notify` spec. Markers
 * never notify. Called on app open and from Settings.
 */
export async function rescheduleReminders(view: View, decisions: WeeklyDecision[]): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const start = todayLocal();
  let count = 0;

  for (let d = 0; d < 4; d++) {
    const date = addDaysISO(start, d);
    for (const occ of dayOccurrences(date, view, decisions)) {
      const spec = occ.routine.notify;
      if (!spec || occ.routine.marker) continue;
      const fireMin = toMinutes(occ.startLocal) - spec.minutesBefore;
      const when = DateTime.fromISO(date, { zone: TZ }).startOf('day').plus({ minutes: fireMin });
      if (when.toMillis() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: occ.routine.title,
          body: occ.routine.terseLine
        },
        trigger: { date: when.toJSDate() }
      });
      count++;
    }
  }
  return count;
}

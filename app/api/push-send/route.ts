import { format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { configureWebPush, isPushConfigured, sendPushNotification } from '@/lib/push';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function buildMissedTaskMessage(date: string): Promise<string> {
  const supabase = getServiceSupabaseClient();
  const [{ count: totalActivities }, { count: completedActivities }, { count: completedMeals }, { data: careLog }] =
    await Promise.all([
      supabase.from('activities').select('id', { count: 'exact', head: true }),
      supabase
        .from('daily_logs')
        .select('id', { count: 'exact', head: true })
        .eq('date', date)
        .eq('completed', true),
      supabase
        .from('nutrition_logs')
        .select('id', { count: 'exact', head: true })
        .eq('date', date)
        .eq('had_meal', true),
      supabase.from('care_logs').select('id').eq('date', date).maybeSingle()
    ]);

  const missedActivities = Math.max(0, (totalActivities ?? 0) - (completedActivities ?? 0));
  const missedMeals = Math.max(0, 3 - (completedMeals ?? 0));
  const missingCare = !careLog;

  const parts = [];
  if (missedActivities > 0) parts.push(`${missedActivities} activities`);
  if (missedMeals > 0) parts.push(`${missedMeals} meals`);
  if (missingCare) parts.push('care routine');

  if (!parts.length) {
    return 'Great job. All key logs for today look complete.';
  }

  return `Still pending today: ${parts.join(', ')}.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications are not configured on the server' },
        { status: 503 }
      );
    }

    const cronSecret = process.env.REMINDER_CRON_SECRET;
    const providedSecret = request.headers.get('x-reminder-key');
    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const date = typeof body?.date === 'string' ? body.date : format(new Date(), 'yyyy-MM-dd');
    const customTitle = typeof body?.title === 'string' ? body.title : null;
    const customBody = typeof body?.body === 'string' ? body.body : null;

    configureWebPush();

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message = customBody ?? (await buildMissedTaskMessage(date));
    const title = customTitle ?? "Ahana's Tracker Reminder";

    let sent = 0;
    let failed = 0;

    for (const row of (subscriptions ?? []) as SubscriptionRow[]) {
      try {
        await sendPushNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth }
          },
          {
            title,
            body: message,
            url: `/?date=${date}`
          }
        );
        sent += 1;
      } catch (pushError) {
        failed += 1;
        const statusCode = Number((pushError as { statusCode?: number })?.statusCode);
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('endpoint', row.endpoint);
        }
      }
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'push_notification',
      action: 'send',
      entityType: 'push_subscriptions',
      eventDate: date,
      payload: { title, message, sent, failed }
    });

    return NextResponse.json({ ok: true, sent, failed, date, title, message });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

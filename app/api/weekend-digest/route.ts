import { format, nextSaturday, nextSunday } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { configureWebPush, isPushConfigured, sendPushNotification } from '@/lib/push';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { ToddlerEvent } from '@/lib/types';

type SubscriptionRow = { endpoint: string; p256dh: string; auth: string };

function isAuthorizedForCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

function isAuthorizedForManualPost(request: NextRequest): boolean {
  const reminderSecret = process.env.REMINDER_CRON_SECRET;
  if (!reminderSecret) return true;
  return request.headers.get('x-reminder-key') === reminderSecret;
}

// Picks a short, free-first list of things happening this weekend.
async function pickWeekendEvents(): Promise<{ events: ToddlerEvent[]; saturday: string; sunday: string }> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  const saturday = format(nextSaturday(now), 'yyyy-MM-dd');
  const sunday = format(nextSunday(now), 'yyyy-MM-dd');

  const [{ data: dated }, { data: attractions }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'id, title, description, event_date, start_time, end_time, venue_name, city, address, is_free, cost_text, setting, category, min_age_months, max_age_months, event_type, source_url, booking_url, verified, last_checked_at'
      )
      .in('event_date', [saturday, sunday]),
    supabase
      .from('events')
      .select(
        'id, title, description, event_date, start_time, end_time, venue_name, city, address, is_free, cost_text, setting, category, min_age_months, max_age_months, event_type, source_url, booking_url, verified, last_checked_at'
      )
      .is('event_date', null)
      .eq('is_free', true)
      .limit(5)
  ]);

  const combined = [...((dated ?? []) as ToddlerEvent[]), ...((attractions ?? []) as ToddlerEvent[])];
  // Free first, then verified first.
  combined.sort((a, b) => Number(b.is_free) - Number(a.is_free) || Number(b.verified) - Number(a.verified));
  return { events: combined, saturday, sunday };
}

async function sendDigest(request: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'Push notifications are not configured on the server' }, { status: 503 });
  }
  configureWebPush();

  const supabase = getServiceSupabaseClient();
  const requestMeta = getRequestMeta(request);
  const { events, saturday, sunday } = await pickWeekendEvents();

  if (events.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, reason: 'no weekend events' });
  }

  const top = events.slice(0, 3).map((event) => event.title);
  const freeCount = events.filter((event) => event.is_free).length;
  const title = 'This weekend with Ahana';
  const body = `${top.join(' · ')}${events.length > 3 ? ` +${events.length - 3} more` : ''} (${freeCount} free). Tap to explore.`;

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of (subscriptions ?? []) as SubscriptionRow[]) {
    try {
      await sendPushNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        { title, body, url: '/things-to-do' }
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
    eventType: 'weekend_digest',
    action: 'send',
    entityType: 'push_subscriptions',
    payload: { title, body, sent, failed, saturday, sunday, eventCount: events.length }
  });

  return NextResponse.json({ ok: true, sent, failed, saturday, sunday, eventCount: events.length });
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedForCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return await sendDigest(request);
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedForCron(request) && !isAuthorizedForManualPost(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return await sendDigest(request);
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

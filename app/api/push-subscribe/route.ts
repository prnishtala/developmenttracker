import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { isPushConfigured } from '@/lib/push';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

type IncomingSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications are not configured on the server' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { subscription, timezone } = body as { subscription: IncomingSubscription; timezone?: string | null };

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expiration_time: subscription.expirationTime ?? null,
        timezone: timezone ?? null,
        active: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'push_subscription',
      action: 'upsert',
      entityType: 'push_subscriptions',
      entityId: subscription.endpoint,
      payload: { timezone: timezone ?? null }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

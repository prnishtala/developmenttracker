import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, favorited } = body as { eventId?: string; favorited?: boolean };

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    if (favorited) {
      const { error } = await supabase
        .from('event_favorites')
        .upsert({ event_id: eventId }, { onConflict: 'event_id' });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('event_favorites').delete().eq('event_id', eventId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'event_favorite',
      action: favorited ? 'add' : 'remove',
      entityType: 'event_favorites',
      entityId: eventId,
      payload: { favorited: Boolean(favorited) }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

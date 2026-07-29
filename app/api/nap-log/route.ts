import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, date, startTime, endTime, durationMinutes, entryMode } = body as {
      action: 'create' | 'update' | 'delete';
      id?: string;
      date?: string;
      startTime?: string;
      endTime?: string | null;
      durationMinutes?: number | null;
      entryMode?: 'end_time' | 'duration';
    };

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
      }

      const { error } = await supabase.from('nap_logs').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await writeAuditLog(supabase, requestMeta, {
        eventType: 'nap_log',
        action: 'delete',
        entityType: 'nap_logs',
        entityId: id
      });

      return NextResponse.json({ ok: true });
    }

    if (!date || !startTime || !entryMode) {
      return NextResponse.json({ error: 'date, startTime and entryMode are required' }, { status: 400 });
    }

    const payload = {
      date,
      start_time: startTime,
      end_time: entryMode === 'end_time' ? endTime : null,
      duration_minutes: entryMode === 'duration' ? durationMinutes : null,
      entry_mode: entryMode
    };

    if (action === 'create') {
      // Dedupe repeated recaps: a nap starting at the same time on the same day
      // is the same nap. Update the existing row (filling in an end time if this
      // recap has one) instead of inserting a duplicate.
      const { data: existingNap } = await supabase
        .from('nap_logs')
        .select('id, end_time, duration_minutes, entry_mode')
        .eq('date', date)
        .eq('start_time', startTime)
        .maybeSingle();

      if (existingNap?.id) {
        // Only overwrite the existing nap's timing when this recap actually adds
        // detail (an end time / duration); otherwise leave the richer row as-is.
        const addsDetail = payload.end_time !== null || payload.duration_minutes !== null;
        if (addsDetail) {
          await supabase.from('nap_logs').update(payload).eq('id', existingNap.id);
        }
        const { data: merged } = await supabase.from('nap_logs').select().eq('id', existingNap.id).single();

        await writeAuditLog(supabase, requestMeta, {
          eventType: 'nap_log',
          action: 'create_deduped',
          entityType: 'nap_logs',
          entityId: existingNap.id,
          eventDate: date,
          payload
        });

        return NextResponse.json({ ok: true, nap: merged, deduped: true });
      }

      const { data, error } = await supabase.from('nap_logs').insert(payload).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await writeAuditLog(supabase, requestMeta, {
        eventType: 'nap_log',
        action: 'create',
        entityType: 'nap_logs',
        entityId: data.id,
        eventDate: date,
        payload
      });

      return NextResponse.json({ ok: true, nap: data });
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
    }

    const { error } = await supabase.from('nap_logs').update(payload).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'nap_log',
      action: 'update',
      entityType: 'nap_logs',
      entityId: id,
      eventDate: date,
      payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

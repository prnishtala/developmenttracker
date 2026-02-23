import { NextRequest, NextResponse } from 'next/server';
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

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
      }

      const { error } = await supabase.from('nap_logs').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
      const { data, error } = await supabase.from('nap_logs').insert(payload).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, nap: data });
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
    }

    const { error } = await supabase.from('nap_logs').update(payload).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

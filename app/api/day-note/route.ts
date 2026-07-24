import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, notes } = body as { date?: string; notes?: string };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date (YYYY-MM-DD) is required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);
    const trimmed = typeof notes === 'string' ? notes.trim() : '';

    const { error } = await supabase
      .from('day_notes')
      .upsert({ date, notes: trimmed || null, updated_at: new Date().toISOString() }, { onConflict: 'date' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'day_note',
      action: 'upsert',
      entityType: 'day_notes',
      entityId: date,
      eventDate: date,
      payload: { length: trimmed.length }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

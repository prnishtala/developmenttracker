import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action : 'upsert';
    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    if (action === 'delete') {
      const id = typeof body?.id === 'string' ? body.id : '';
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      const { error } = await supabase.from('growth_measurements').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(supabase, requestMeta, { eventType: 'growth', action: 'delete', entityType: 'growth_measurements', entityId: id });
      return NextResponse.json({ ok: true });
    }

    const { measuredOn, weightKg, heightCm, headCircumferenceCm, notes } = body as {
      measuredOn?: string;
      weightKg?: unknown;
      heightCm?: unknown;
      headCircumferenceCm?: unknown;
      notes?: string;
    };

    if (!measuredOn || !/^\d{4}-\d{2}-\d{2}$/.test(measuredOn)) {
      return NextResponse.json({ error: 'measuredOn (YYYY-MM-DD) is required' }, { status: 400 });
    }

    const payload = {
      measured_on: measuredOn,
      weight_kg: toNumberOrNull(weightKg),
      height_cm: toNumberOrNull(heightCm),
      head_circumference_cm: toNumberOrNull(headCircumferenceCm),
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      updated_at: new Date().toISOString()
    };

    if (payload.weight_kg === null && payload.height_cm === null && payload.head_circumference_cm === null) {
      return NextResponse.json({ error: 'Enter at least a weight or height' }, { status: 400 });
    }

    const { error } = await supabase.from('growth_measurements').upsert(payload, { onConflict: 'measured_on' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'growth',
      action: 'upsert',
      entityType: 'growth_measurements',
      entityId: measuredOn,
      eventDate: measuredOn,
      payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

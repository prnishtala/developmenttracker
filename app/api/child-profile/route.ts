import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, birthDate, sex } = body as { name?: string; birthDate?: string | null; sex?: string };

    const payload: Record<string, unknown> = { singleton: true, updated_at: new Date().toISOString() };
    if (typeof name === 'string' && name.trim()) payload.name = name.trim();
    if (birthDate === null || (typeof birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDate))) {
      payload.birth_date = birthDate;
    }
    if (sex === 'female' || sex === 'male') payload.sex = sex;

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);
    const { error } = await supabase.from('child_profile').upsert(payload, { onConflict: 'singleton' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'child_profile',
      action: 'upsert',
      entityType: 'child_profile',
      payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

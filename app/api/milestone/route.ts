import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

const VALID = new Set(['achieved', 'emerging', 'not_yet']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestoneKey, status, notedOn } = body as { milestoneKey?: string; status?: string; notedOn?: string | null };

    if (!milestoneKey || !status || !VALID.has(status)) {
      return NextResponse.json({ error: 'milestoneKey and a valid status are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);
    const payload = {
      milestone_key: milestoneKey,
      status,
      noted_on: status === 'achieved' ? (typeof notedOn === 'string' ? notedOn : new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('milestone_records').upsert(payload, { onConflict: 'milestone_key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'milestone',
      action: 'upsert',
      entityType: 'milestone_records',
      entityId: milestoneKey,
      payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

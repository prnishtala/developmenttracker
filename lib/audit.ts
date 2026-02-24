import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

type AuditEvent = {
  eventType: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  eventDate?: string | null;
  payload?: Record<string, unknown> | null;
};

export function getRequestMeta(request: NextRequest): { requestIp: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for');
  const requestIp = forwarded?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');
  return { requestIp, userAgent };
}

export async function writeAuditLog(
  supabase: SupabaseClient,
  requestMeta: { requestIp: string | null; userAgent: string | null },
  event: AuditEvent
) {
  const { error } = await supabase.from('audit_logs').insert({
    event_type: event.eventType,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    event_date: event.eventDate ?? null,
    request_ip: requestMeta.requestIp,
    user_agent: requestMeta.userAgent,
    payload: event.payload ?? null
  });

  if (error) {
    console.error('audit-log-write-failed', error.message);
  }
}

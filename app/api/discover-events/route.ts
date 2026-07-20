import { addDays, format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { discoverAiEvents, discoverFromSource } from '@/lib/events/discover';
import { ExtractedEvent } from '@/lib/events/types';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { EVENTS_HORIZON_DAYS } from '@/lib/constants';
import { EventSource } from '@/lib/types';

export const maxDuration = 300;

function isAuthorizedForCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

function toRow(event: ExtractedEvent, sourceId: string | null, verified: boolean) {
  const now = new Date().toISOString();
  return {
    title: event.title,
    description: event.description,
    event_date: event.event_date,
    start_time: event.start_time,
    end_time: event.end_time,
    venue_name: event.venue_name,
    city: event.city,
    address: event.address,
    is_free: event.is_free,
    cost_text: event.cost_text,
    setting: event.setting,
    category: event.category,
    min_age_months: event.min_age_months,
    max_age_months: event.max_age_months,
    event_type: event.event_type,
    source_id: sourceId,
    source_url: event.source_url,
    booking_url: event.booking_url,
    verified,
    last_checked_at: now,
    updated_at: now
  };
}

async function runDiscovery(request: NextRequest) {
  const supabase = getServiceSupabaseClient();
  const requestMeta = getRequestMeta(request);

  const today = format(new Date(), 'yyyy-MM-dd');
  const to = format(addDays(new Date(), EVENTS_HORIZON_DAYS - 1), 'yyyy-MM-dd');
  const window = { from: today, to };

  // Cleanup: drop past dated events, and regenerate the unverified (AI) layer each run.
  await supabase.from('events').delete().lt('event_date', today);
  await supabase.from('events').delete().eq('verified', false);

  const { data: sources, error: sourcesError } = await supabase
    .from('event_sources')
    .select('id, name, city, url, source_type, category_hint, active, notes')
    .eq('active', true);

  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 });
  }

  const typedSources = (sources ?? []) as EventSource[];
  const aiSource = typedSources.find((source) => source.source_type === 'ai_discovery') ?? null;

  let curatedUpserted = 0;
  let discoveredUpserted = 0;
  let sourcesOk = 0;
  let sourcesFailed = 0;

  // Curated pass (verified) — one source at a time, never let one failure abort the run.
  for (const source of typedSources) {
    if (source.source_type === 'ai_discovery') continue;
    try {
      const extracted = await discoverFromSource(source, window);
      if (extracted.length > 0) {
        const rows = extracted.map((event) => toRow(event, source.id, true));
        const { error } = await supabase
          .from('events')
          .upsert(rows, { onConflict: 'source_url,event_date,title' });
        if (error) {
          sourcesFailed += 1;
        } else {
          curatedUpserted += rows.length;
          sourcesOk += 1;
        }
      } else {
        sourcesOk += 1;
      }
    } catch {
      sourcesFailed += 1;
    }
  }

  // Hybrid AI-discovery pass (unverified) — inserted fresh (past-false rows were cleared above).
  try {
    const aiEvents = await discoverAiEvents(window);
    if (aiEvents.length > 0) {
      const rows = aiEvents.map((event) => toRow(event, aiSource?.id ?? null, false));
      const { error } = await supabase.from('events').insert(rows);
      if (!error) {
        discoveredUpserted += rows.length;
      }
    }
  } catch {
    // discovery is best-effort; ignore failures
  }

  await writeAuditLog(supabase, requestMeta, {
    eventType: 'event_discovery',
    action: 'refresh',
    entityType: 'events',
    eventDate: today,
    payload: { curatedUpserted, discoveredUpserted, sourcesOk, sourcesFailed, window }
  });

  return NextResponse.json({
    ok: true,
    window,
    curatedUpserted,
    discoveredUpserted,
    sourcesOk,
    sourcesFailed
  });
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedForCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return await runDiscovery(request);
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

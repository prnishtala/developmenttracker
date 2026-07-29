import { NextRequest, NextResponse } from 'next/server';
import { ACTIVITY_CATEGORIES, ACTIVITY_SKILL_TAGS, CATEGORY_DEFAULT_SKILLS, DURATION_OPTIONS } from '@/lib/constants';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type SupabaseClient = ReturnType<typeof getServiceSupabaseClient>;

// Create an activity row if one with this name doesn't exist yet, else reuse it.
// Voice-created activities are flagged ad_hoc so they stay out of the planned
// rotation but still feed dashboard trends. Falls back to the pre-ad_hoc schema.
async function findOrCreateActivity(
  supabase: SupabaseClient,
  name: string,
  category: string,
  skillTags: string[]
): Promise<{ id: string; created: boolean } | null> {
  const existing = await supabase.from('activities').select('id').ilike('name', name).limit(1).maybeSingle();
  if (!existing.error && existing.data?.id) {
    return { id: existing.data.id as string, created: false };
  }

  const insertWithAdHoc = await supabase
    .from('activities')
    .insert({ name, category, skill_tags: skillTags, ad_hoc: true })
    .select('id')
    .single();
  if (!insertWithAdHoc.error && insertWithAdHoc.data?.id) {
    return { id: insertWithAdHoc.data.id as string, created: true };
  }

  const insertLegacy = await supabase
    .from('activities')
    .insert({ name, category, skill_tags: skillTags })
    .select('id')
    .single();
  if (!insertLegacy.error && insertLegacy.data?.id) {
    return { id: insertLegacy.data.id as string, created: true };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const date = typeof body?.date === 'string' ? body.date : '';
    if (!date || !name) {
      return NextResponse.json({ error: 'date and name are required' }, { status: 400 });
    }

    const category = ACTIVITY_CATEGORIES.includes(body?.category) ? body.category : 'Social Emotional';
    const rawTags: string[] = Array.isArray(body?.skillTags) ? body.skillTags : [];
    const skillTags = rawTags.filter((t) => ACTIVITY_SKILL_TAGS.includes(t as (typeof ACTIVITY_SKILL_TAGS)[number]));
    const finalTags = skillTags.length ? skillTags.slice(0, 4) : CATEGORY_DEFAULT_SKILLS[category] ?? ['Attention'];
    const duration = DURATION_OPTIONS.includes(body?.duration) ? body.duration : '5 to 10';
    const rating = typeof body?.rating === 'string' ? body.rating : null;

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    const activity = await findOrCreateActivity(supabase, name, category, finalTags);
    if (!activity) {
      return NextResponse.json({ error: 'could not create activity' }, { status: 500 });
    }

    const { error: logError } = await supabase.from('daily_logs').upsert(
      {
        date,
        activity_id: activity.id,
        completed: true,
        rating,
        duration
      },
      { onConflict: 'date,activity_id' }
    );

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'daily_log',
      action: 'voice_activity',
      entityType: 'daily_logs',
      entityId: activity.id,
      eventDate: date,
      payload: { name, category, skillTags: finalTags, duration, created: activity.created }
    });

    return NextResponse.json({
      ok: true,
      created: activity.created,
      activity: { id: activity.id, name, category, skill_tags: finalTags, duration }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

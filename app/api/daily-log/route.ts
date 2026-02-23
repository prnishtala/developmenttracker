import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, activityId, completed, rating, duration } = body as {
      date: string;
      activityId: string;
      completed?: boolean;
      rating?: string;
      duration?: string;
    };

    if (!date || !activityId) {
      return NextResponse.json({ error: 'date and activityId are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from('daily_logs').upsert(
      {
        date,
        activity_id: activityId,
        completed: completed ?? false,
        rating: rating || null,
        duration: duration || null
      },
      { onConflict: 'date,activity_id' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

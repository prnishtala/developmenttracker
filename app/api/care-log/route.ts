import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, ironDrops, multivitaminDrops, vitaminCGiven, vitaminCFruit, bathCompleted, bathDuration } = body as {
      date: string;
      ironDrops: boolean;
      multivitaminDrops: boolean;
      vitaminCGiven: boolean;
      vitaminCFruit: string | null;
      bathCompleted: boolean;
      bathDuration: string | null;
    };

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from('care_logs').upsert(
      {
        date,
        iron_drops: ironDrops,
        multivitamin_drops: multivitaminDrops,
        vitamin_c_given: vitaminCGiven && (ironDrops || multivitaminDrops),
        vitamin_c_fruit: vitaminCGiven && (ironDrops || multivitaminDrops) ? vitaminCFruit : null,
        bath_completed: bathCompleted,
        bath_duration: bathCompleted ? bathDuration : null
      },
      { onConflict: 'date' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

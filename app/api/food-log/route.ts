import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, foodGroup, selected, newFood, packaged } = body as {
      date: string;
      foodGroup: string;
      selected: boolean;
      newFood: boolean;
      packaged: boolean;
    };

    if (!date || !foodGroup) {
      return NextResponse.json({ error: 'date and foodGroup are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();

    if (!selected) {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('date', date)
        .eq('food_group', foodGroup);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from('food_logs').upsert(
      {
        date,
        food_group: foodGroup,
        new_food: newFood,
        packaged
      },
      { onConflict: 'date,food_group' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

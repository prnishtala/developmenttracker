import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, mealType, hadMeal, quantity } = body as {
      date: string;
      mealType: string;
      hadMeal: boolean;
      quantity: string | null;
    };

    if (!date || !mealType) {
      return NextResponse.json({ error: 'date and mealType are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from('nutrition_logs').upsert(
      {
        date,
        meal_type: mealType,
        had_meal: hadMeal,
        quantity: hadMeal ? quantity : null
      },
      { onConflict: 'date,meal_type' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, mealType, hadMeal, quantity, mealNotes } = body as {
      date: string;
      mealType: string;
      hadMeal: boolean;
      quantity: string | null;
      mealNotes: string | null;
    };

    if (!date || !mealType) {
      return NextResponse.json({ error: 'date and mealType are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);
    const { error } = await supabase.from('nutrition_logs').upsert(
      {
        date,
        meal_type: mealType,
        had_meal: hadMeal,
        quantity: hadMeal ? quantity : null,
        meal_notes: hadMeal ? (mealNotes?.trim() || null) : null
      },
      { onConflict: 'date,meal_type' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'nutrition_log',
      action: 'upsert',
      entityType: 'nutrition_logs',
      entityId: mealType,
      eventDate: date,
      payload: {
        hadMeal,
        quantity: hadMeal ? quantity : null,
        mealNotes: hadMeal ? (mealNotes?.trim() || null) : null
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

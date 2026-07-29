import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
import { higherQuantity, mergeMealNotes } from '@/lib/recap-merge';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, mealType, hadMeal, quantity, mealNotes, mode } = body as {
      date: string;
      mealType: string;
      hadMeal: boolean;
      quantity: string | null;
      mealNotes: string | null;
      // 'merge' makes a repeat recap additive (union notes + keep the higher
      // quantity) instead of overwriting the slot. Default is 'replace'.
      mode?: 'merge' | 'replace';
    };

    const normalizedMealType = typeof mealType === 'string' ? mealType.trim() : '';

    if (!date || !normalizedMealType) {
      return NextResponse.json({ error: 'date and mealType are required' }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const requestMeta = getRequestMeta(request);

    let nextQuantity = hadMeal ? quantity : null;
    let nextNotes = hadMeal ? mealNotes?.trim() || null : null;

    if (mode === 'merge' && hadMeal) {
      const { data: existing } = await supabase
        .from('nutrition_logs')
        .select('had_meal, quantity, meal_notes')
        .eq('date', date)
        .eq('meal_type', normalizedMealType)
        .maybeSingle();
      if (existing?.had_meal) {
        nextNotes = mergeMealNotes(existing.meal_notes, nextNotes) || null;
        nextQuantity = higherQuantity(existing.quantity, quantity);
      }
    }

    const { error } = await supabase.from('nutrition_logs').upsert(
      {
        date,
        meal_type: normalizedMealType,
        had_meal: hadMeal,
        quantity: nextQuantity,
        meal_notes: nextNotes
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
      entityId: normalizedMealType,
      eventDate: date,
      payload: {
        hadMeal,
        quantity: nextQuantity,
        mealNotes: nextNotes,
        mode: mode ?? 'replace'
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

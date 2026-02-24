import { NextRequest, NextResponse } from 'next/server';
import { getRequestMeta, writeAuditLog } from '@/lib/audit';
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
    const requestMeta = getRequestMeta(request);

    if (!selected) {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('date', date)
        .eq('food_group', foodGroup);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await writeAuditLog(supabase, requestMeta, {
        eventType: 'food_log',
        action: 'delete',
        entityType: 'food_logs',
        entityId: foodGroup,
        eventDate: date,
        payload: { selected: false }
      });

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

    await writeAuditLog(supabase, requestMeta, {
      eventType: 'food_log',
      action: 'upsert',
      entityType: 'food_logs',
      entityId: foodGroup,
      eventDate: date,
      payload: { selected: true, newFood, packaged }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

import { format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getPlannedActivitiesForDate } from '@/lib/data';
import { extractRecap } from '@/lib/recap-extract';

export const runtime = 'nodejs';

// Re-extract a recap from edited/typed text (no audio).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = typeof body?.transcript === 'string' ? body.transcript : '';
    const date = typeof body?.date === 'string' ? body.date : format(new Date(), 'yyyy-MM-dd');

    if (!transcript.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    let plannedNames: string[] = [];
    try {
      plannedNames = (await getPlannedActivitiesForDate(date)).map((a) => a.name);
    } catch {
      plannedNames = [];
    }

    const recap = await extractRecap(transcript, plannedNames);
    return NextResponse.json({ ok: true, recap });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

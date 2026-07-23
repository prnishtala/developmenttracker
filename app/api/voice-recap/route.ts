import { format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getPlannedActivitiesForDate } from '@/lib/data';
import { extractRecap } from '@/lib/recap-extract';
import { transcribeAudio } from '@/lib/transcribe';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function plannedNamesFor(date: string): Promise<string[]> {
  try {
    const activities = await getPlannedActivitiesForDate(date);
    return activities.map((a) => a.name);
  } catch {
    return [];
  }
}

// Audio end-of-day recap -> transcript + structured {meals, naps, care, activities}.
// Audio is never stored.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const audio = form.get('audio');
    const date = (form.get('date') as string) || format(new Date(), 'yyyy-MM-dd');

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'audio file is required' }, { status: 400 });
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Recording is too long. Keep the recap under a couple of minutes.' }, { status: 413 });
    }

    const result = await transcribeAudio(audio);
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        transcript: null,
        recap: null,
        reason: 'Could not transcribe the recording. Please type the recap instead.',
        detail: result.error
      });
    }

    const recap = await extractRecap(result.text, await plannedNamesFor(date));
    return NextResponse.json({ ok: true, transcript: result.text, recap });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

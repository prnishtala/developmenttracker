import { NextRequest, NextResponse } from 'next/server';
import { extractMealsFromTranscript } from '@/lib/nutrition-voice';

export const runtime = 'nodejs';

// Re-extract meals from an edited transcript (or any typed recap) without
// re-recording. Powers the "re-extract" action after the caretaker fixes text.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = typeof body?.transcript === 'string' ? body.transcript : '';

    if (!transcript.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    const meals = await extractMealsFromTranscript(transcript);
    return NextResponse.json({ ok: true, meals });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractMealsFromTranscript } from '@/lib/nutrition-voice';
import { transcribeAudio } from '@/lib/transcribe';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Accepts an audio note (multipart form field "audio"), transcribes it, and
// extracts structured meals. The audio itself is never stored.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const audio = form.get('audio');

    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'audio file is required' }, { status: 400 });
    }
    // Guard against oversized uploads (~25 MB is the transcription limit).
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Recording is too long. Keep voice notes under a couple of minutes.' }, { status: 413 });
    }

    const transcript = await transcribeAudio(audio);
    if (!transcript) {
      return NextResponse.json({
        ok: false,
        transcript: null,
        meals: [],
        reason: 'Could not transcribe the recording. Please type the note instead.'
      });
    }

    const meals = await extractMealsFromTranscript(transcript);
    return NextResponse.json({ ok: true, transcript, meals });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(error) }, { status: 500 });
  }
}

// Audio transcription via OpenAI (Whisper). Used by the voice meal logger.
// Returns the transcript text, or null on any failure so callers can fall back
// to letting the caretaker type the note by hand.

function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('x-m4a')) return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

export async function transcribeAudio(audio: Blob): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!audio || audio.size === 0) return null;

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const ext = extensionForMime(audio.type || '');

  try {
    const form = new FormData();
    form.append('file', audio, `note.${ext}`);
    form.append('model', model);
    // English-first, but the model still handles Indian-English food words and
    // common Hindi terms (dal, roti, sabzi) well.
    form.append('language', 'en');
    form.append('temperature', '0');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    return text || null;
  } catch {
    return null;
  }
}

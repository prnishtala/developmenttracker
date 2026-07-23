// Audio transcription via OpenAI (Whisper). Used by the voice meal logger.
// Returns the transcript text, or a short error reason so the caller can both
// fall back to manual typing AND surface why it failed for debugging.

export type TranscribeResult = { ok: true; text: string } | { ok: false; error: string };

function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('x-m4a')) return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('webm')) return 'webm';
  return 'webm';
}

export async function transcribeAudio(audio: Blob): Promise<TranscribeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY is not set on the server' };
  if (!audio || audio.size === 0) return { ok: false, error: 'empty audio' };

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const ext = extensionForMime(audio.type || '');

  try {
    const form = new FormData();
    // Re-wrap into a fresh Blob with an explicit type so the multipart part
    // carries a correct content-type even if the incoming Blob lost it.
    const file = new Blob([await audio.arrayBuffer()], { type: audio.type || 'audio/webm' });
    form.append('file', file, `note.${ext}`);
    form.append('model', model);
    form.append('language', 'en');
    form.append('temperature', '0');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { ok: false, error: `OpenAI ${response.status} (model ${model}, ${ext}): ${body.slice(0, 400)}` };
    }

    const payload = await response.json();
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    return text ? { ok: true, text } : { ok: false, error: 'transcription returned empty text' };
  } catch (error) {
    return { ok: false, error: `transcription request failed: ${String(error).slice(0, 300)}` };
  }
}

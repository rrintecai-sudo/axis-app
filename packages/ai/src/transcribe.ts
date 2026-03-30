import { toFile } from 'openai';
import { openai } from './client.js';

function extensionFromMime(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('wav')) return 'wav';
  return 'ogg'; // WhatsApp default
}

/**
 * Transcribes a WhatsApp voice note buffer using OpenAI Whisper.
 * Returns the transcribed text in the detected language.
 */
export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = extensionFromMime(mimeType);
  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });

  return result.text;
}

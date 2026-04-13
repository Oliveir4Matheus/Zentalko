import { createHash } from 'node:crypto';

const DEFAULT_VOICE = 'en-US-AriaNeural';

export interface SynthesizeInput {
  text: string;
  voice?: string;
}

export interface SynthesizedAudio {
  bytes: Buffer;
  cacheKey: string;
  contentType: 'audio/mpeg';
}

function cacheKeyFor(text: string, voice: string): string {
  return createHash('sha1').update(`${voice}::${text}`).digest('hex');
}

/**
 * Calls the edge-tts microservice. Throws on non-2xx. Caller is responsible
 * for caching (see `src/lib/storage/minio.ts`).
 */
export async function synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
  const base = process.env.TTS_URL;
  if (!base) throw new Error('TTS_URL is not configured');

  const voice = input.voice ?? DEFAULT_VOICE;
  const res = await fetch(`${base.replace(/\/$/, '')}/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: input.text, voice }),
  });
  if (!res.ok) {
    throw new Error(`TTS HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return {
    bytes: Buffer.from(ab),
    cacheKey: cacheKeyFor(input.text, voice),
    contentType: 'audio/mpeg',
  };
}

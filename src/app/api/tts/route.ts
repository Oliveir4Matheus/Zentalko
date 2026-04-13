import { NextResponse } from 'next/server';
import { synthesize } from '@/lib/tts/client';
import { putIfAbsent, ttsObjectKey } from '@/lib/storage/minio';
import { getCurrentUser } from '@/server/session';
import { consume, LIMITS } from '@/server/rate-limit';
import { TRPCError } from '@trpc/server';

// Fallback silent-mp3 used when TTS/storage aren't configured (dev/e2e).
const SILENT_MP3 = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00]);

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    consume(user.id, LIMITS.tts);
  } catch (err) {
    if (err instanceof TRPCError && err.code === 'TOO_MANY_REQUESTS') {
      return NextResponse.json({ error: 'rate_limited', detail: err.message }, { status: 429 });
    }
    throw err;
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') ?? '';
  const voice = searchParams.get('voice') ?? undefined;
  if (!text) return NextResponse.json({ error: 'missing text' }, { status: 400 });
  // Cap to ~2 minutes of speech (~3000 chars). Larger payloads are typically attacks
  // or accidental misuse — clients should chunk longer text into multiple calls.
  const MAX_TTS_TEXT = 3000;
  if (text.length > MAX_TTS_TEXT) {
    return NextResponse.json(
      { error: 'text_too_long', max: MAX_TTS_TEXT },
      { status: 413 },
    );
  }

  if (!process.env.TTS_URL) {
    return new NextResponse(new Uint8Array(SILENT_MP3), {
      headers: { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=3600' },
    });
  }

  try {
    const audio = await synthesize({ text, voice });
    // Cache via MinIO when storage is configured; otherwise stream through.
    if (process.env.STORAGE_ENDPOINT) {
      const { url } = await putIfAbsent(ttsObjectKey(audio.cacheKey), audio.bytes, audio.contentType);
      return NextResponse.redirect(url, { status: 302 });
    }
    return new NextResponse(new Uint8Array(audio.bytes), {
      headers: {
        'content-type': audio.contentType,
        'cache-control': 'public, max-age=86400',
        etag: audio.cacheKey,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'tts_failed', detail: String((err as Error).message) },
      { status: 502 },
    );
  }
}

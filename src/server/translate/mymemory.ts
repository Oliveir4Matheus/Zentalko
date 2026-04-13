/**
 * MyMemory Translated API — free, keyless, commercial-friendly.
 * Anonymous: 5k words/day per IP. Add `MYMEMORY_EMAIL` env to bump to 50k.
 * https://mymemory.translated.net/doc/spec.php
 */

import { logger } from '@/server/logger';

const log = logger.child({ module: 'mymemory' });
const ENDPOINT = 'https://api.mymemory.translated.net/get';

export interface MyMemoryResult {
  translation: string;
  match: number;
}

export async function translateViaMyMemory(
  text: string,
  langpair = 'en|pt-BR',
): Promise<MyMemoryResult | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', langpair);
  const email = process.env.MYMEMORY_EMAIL;
  if (email) url.searchParams.set('de', email);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) {
      log.warn({ status: resp.status }, 'mymemory.http_error');
      return null;
    }
    const data = (await resp.json()) as {
      responseData?: { translatedText?: string; match?: number };
      responseStatus?: number;
    };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated) return null;
    // API sometimes echoes the source or returns "INVALID ..." strings.
    if (translated.toUpperCase().startsWith('MYMEMORY WARNING')) {
      log.warn({ translated }, 'mymemory.warning');
      return null;
    }
    if (translated.toLowerCase() === text.toLowerCase()) return null;
    return { translation: translated, match: data.responseData?.match ?? 0 };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'mymemory.fetch_failed');
    return null;
  }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateViaMyMemory } from '@/server/translate/mymemory';

const originalFetch = globalThis.fetch;

describe('MyMemory translator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns translation on successful response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        responseData: { translatedText: 'olá', match: 1 },
        responseStatus: 200,
      }),
    }) as unknown as typeof fetch;

    const out = await translateViaMyMemory('hello');
    expect(out?.translation).toBe('olá');
    expect(out?.match).toBe(1);
  });

  it('returns null when API warns (quota exhausted)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        responseData: { translatedText: 'MYMEMORY WARNING: DAILY LIMIT EXCEEDED' },
      }),
    }) as unknown as typeof fetch;

    const out = await translateViaMyMemory('hello');
    expect(out).toBeNull();
  });

  it('returns null when translation echoes the input', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responseData: { translatedText: 'hello' } }),
    }) as unknown as typeof fetch;

    const out = await translateViaMyMemory('hello');
    expect(out).toBeNull();
  });

  it('returns null on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const out = await translateViaMyMemory('hello');
    expect(out).toBeNull();
  });

  it('returns null on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    const out = await translateViaMyMemory('hello');
    expect(out).toBeNull();
  });
});

/**
 * In-memory token-bucket rate limiter keyed by `${userId}:${bucket}`.
 *
 * Zero dependencies, zero persistence — fine for a single-node MVP.
 * Swap for `@upstash/ratelimit` + Redis when we need multi-instance.
 */

import { TRPCError } from '@trpc/server';

interface Entry {
  tokens: number;
  resetAt: number;
}

const STATE = new Map<string, Entry>();

export interface RateLimitOptions {
  /** Bucket identifier (e.g. 'llm', 'tts'). */
  bucket: string;
  /** Max requests per window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
}

export function consume(userId: string, opts: RateLimitOptions): void {
  const now = Date.now();
  const key = `${userId}:${opts.bucket}`;
  const entry = STATE.get(key);
  if (!entry || entry.resetAt <= now) {
    STATE.set(key, { tokens: opts.max - 1, resetAt: now + opts.windowMs });
    return;
  }
  if (entry.tokens <= 0) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Too many requests in bucket "${opts.bucket}". Retry in ${retryAfter}s.`,
    });
  }
  entry.tokens -= 1;
}

/**
 * Non-throwing variant for non-tRPC code paths (e.g. login API route, where we
 * want to short-circuit with a 429 instead of a TRPCError). Returns retryAfter
 * seconds when the bucket is exhausted, or null when the request is allowed.
 */
export function tryConsume(key: string, opts: RateLimitOptions): number | null {
  const now = Date.now();
  const fullKey = `${key}:${opts.bucket}`;
  const entry = STATE.get(fullKey);
  if (!entry || entry.resetAt <= now) {
    STATE.set(fullKey, { tokens: opts.max - 1, resetAt: now + opts.windowMs });
    return null;
  }
  if (entry.tokens <= 0) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }
  entry.tokens -= 1;
  return null;
}

// Presets used across the app.
/** Test-only: clears the in-memory bucket state. */
export function __resetRateLimitState(): void {
  STATE.clear();
}

export const LIMITS = {
  llm: { bucket: 'llm', max: 30, windowMs: 60_000 },
  tts: { bucket: 'tts', max: 60, windowMs: 60_000 },
  upload: { bucket: 'upload', max: 5, windowMs: 60_000 },
  // Brute-force defense on auth: 10 attempts per email or IP per 15 minutes.
  login: { bucket: 'login', max: 10, windowMs: 15 * 60_000 },
  signup: { bucket: 'signup', max: 5, windowMs: 60 * 60_000 },
} as const;

import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { createCaller } from '@/server/trpc/router';
// @ts-expect-error
import { signUpWithPassword } from '@/server/auth';

describe('trpc export — user data export', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    await resetDatabase();
    const { user } = await signUpWithPassword({
      email: 'x@e.com',
      password: 'senha-forte-1',
    });
    caller = createCaller({ userId: user.id, locale: 'pt-BR' });
  });

  it('should export all user data as a single JSON payload', async () => {
    await caller.flashcards.create({
      front: 'hi',
      back: 'oi',
      direction: 'EN_TO_PT',
    });

    const dump = await caller.export.userData();

    expect(dump).toMatchObject({
      user: expect.any(Object),
      flashcards: expect.any(Array),
      reviewLogs: expect.any(Array),
      books: expect.any(Array),
      readingSessions: expect.any(Array),
      settings: expect.any(Object),
    });
    expect(dump.flashcards.length).toBeGreaterThan(0);
  });

  it('should omit API keys (even encrypted) from the export', async () => {
    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-secret' });

    const dump = await caller.export.userData();

    expect(JSON.stringify(dump)).not.toContain('sk-secret');
    expect(dump).not.toHaveProperty('apiKeys');
  });
});

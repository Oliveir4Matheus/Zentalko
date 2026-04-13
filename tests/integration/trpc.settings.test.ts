import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { createCaller } from '@/server/trpc/router';
// @ts-expect-error
import { signUpWithPassword } from '@/server/auth';
// @ts-expect-error
import { prisma } from '@/server/db';

/**
 * BYOK settings — keys must be encrypted at rest, never returned in plaintext.
 */
describe('trpc settings router — BYOK', () => {
  let caller: ReturnType<typeof createCaller>;
  let userId: string;

  beforeEach(async () => {
    await resetDatabase();
    const { user } = await signUpWithPassword({
      email: 's@e.com',
      password: 'senha-forte-1',
    });
    userId = user.id;
    caller = createCaller({ userId, locale: 'pt-BR' });
  });

  it('should save an API key and store it encrypted at rest', async () => {
    const plaintext = 'sk-ant-super-secret-12345';
    await caller.settings.saveApiKey({ provider: 'claude', key: plaintext });

    const row = await prisma.apiKey.findFirst({ where: { userId, provider: 'claude' } });
    expect(row).toBeDefined();
    expect(row.encryptedKey).not.toContain(plaintext); // crypto at rest
    expect(row.encryptedKey.length).toBeGreaterThan(plaintext.length);
  });

  it('should never return the plaintext key in list responses', async () => {
    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-ant-XYZ' });

    const keys = await caller.settings.listApiKeys();

    expect(JSON.stringify(keys)).not.toContain('sk-ant-XYZ');
    expect(keys[0]).toMatchObject({ provider: 'claude', maskedKey: expect.any(String) });
  });

  it('should update an existing key, replacing the stored ciphertext', async () => {
    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-old' });
    const before = await prisma.apiKey.findFirst({ where: { userId, provider: 'claude' } });

    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-new' });
    const after = await prisma.apiKey.findFirst({ where: { userId, provider: 'claude' } });

    expect(after.encryptedKey).not.toBe(before.encryptedKey);
  });

  it('should delete an API key', async () => {
    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-x' });

    await caller.settings.deleteApiKey({ provider: 'claude' });

    const row = await prisma.apiKey.findFirst({ where: { userId, provider: 'claude' } });
    expect(row).toBeNull();
  });

  it('should enforce at least one key before finishing onboarding', async () => {
    await expect(
      caller.settings.completeOnboarding({
        cefrLevel: 'A2',
        dailyNewCardLimit: 10,
      }),
    ).rejects.toThrow(/at least one|api key/i);
  });

  it('should persist user-defined provider order', async () => {
    await caller.settings.saveApiKey({ provider: 'claude', key: 'sk-a' });
    await caller.settings.saveApiKey({ provider: 'openai', key: 'sk-b' });

    await caller.settings.setProviderOrder({ order: ['openai', 'claude'] });

    const order = await caller.settings.getProviderOrder();
    expect(order).toEqual(['openai', 'claude']);
  });
});

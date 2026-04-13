import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { createCaller } from '@/server/trpc/router';
// @ts-expect-error
import { signUpWithPassword } from '@/server/auth';

describe('gamification — streak, XP, levels', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    await resetDatabase();
    const { user } = await signUpWithPassword({
      email: 'g@e.com',
      password: 'senha-forte-1',
    });
    caller = createCaller({ userId: user.id, locale: 'pt-BR' });
  });

  it('should award XP when a card is reviewed', async () => {
    const card = await caller.flashcards.create({
      front: 'hi',
      back: 'oi',
      direction: 'EN_TO_PT',
    });
    const before = await caller.stats.me();

    await caller.flashcards.review({ cardId: card.id, rating: 'Good' });
    const after = await caller.stats.me();

    expect(after.xp).toBeGreaterThan(before.xp);
  });

  it('should increment streakDays when a review happens on a new calendar day', async () => {
    const stats = await caller.stats.me();
    const before = stats.streakDays;

    await caller.stats.registerDailyActivity({ at: new Date() });
    const after = await caller.stats.me();

    expect(after.streakDays).toBe(before + 1);
  });

  it('should reset streak to 1 when a day is skipped', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    await caller.stats.registerDailyActivity({ at: twoDaysAgo });

    await caller.stats.registerDailyActivity({ at: new Date() });
    const after = await caller.stats.me();

    expect(after.streakDays).toBe(1);
  });
});

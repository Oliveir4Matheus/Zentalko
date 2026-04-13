import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { createCaller } from '@/server/trpc/router';
// @ts-expect-error
import { signUpWithPassword } from '@/server/auth';

/**
 * tRPC flashcard routes — covers creation, listing, review, daily limit.
 */
describe('trpc flashcards router', () => {
  let caller: ReturnType<typeof createCaller>;
  let userId: string;

  beforeEach(async () => {
    await resetDatabase();
    const { user } = await signUpWithPassword({
      email: 'u@e.com',
      password: 'senha-forte-1',
    });
    userId = user.id;
    caller = createCaller({ userId, locale: 'pt-BR' });
  });

  it('should create a manual flashcard with required fields', async () => {
    const card = await caller.flashcards.create({
      front: 'ephemeral',
      back: 'efêmero',
      direction: 'EN_TO_PT',
    });

    expect(card.id).toBeDefined();
    expect(card.state).toBe('New');
  });

  it('should generate flashcards from AI given a topic', async () => {
    const cards = await caller.flashcards.generateFromTopic({
      topic: 'kitchen vocabulary',
      count: 5,
    });

    expect(cards).toHaveLength(5);
    for (const c of cards) expect(c.front.length).toBeGreaterThan(0);
  });

  it('should persist a review log on submit and update SRS state', async () => {
    const card = await caller.flashcards.create({
      front: 'a',
      back: 'a',
      direction: 'EN_TO_PT',
    });

    const reviewed = await caller.flashcards.review({
      cardId: card.id,
      rating: 'Good',
    });

    expect(reviewed.reps).toBe(1);
    expect(reviewed.dueAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should respect the daily new-card limit (no new cards above the cap)', async () => {
    await caller.settings.update({ dailyNewCardLimit: 3 });
    for (let i = 0; i < 10; i++) {
      await caller.flashcards.create({
        front: `w${i}`,
        back: `p${i}`,
        direction: 'EN_TO_PT',
      });
    }

    const queue = await caller.flashcards.dueQueue();

    const newOnes = queue.filter((c: { state: string }) => c.state === 'New');
    expect(newOnes.length).toBeLessThanOrEqual(3); // enforce dailyNewCardLimit
  });

  it('should support cloze-deletion cards', async () => {
    const card = await caller.flashcards.create({
      front: 'She {{c1::ran}} to the store.',
      back: 'Ela correu até a loja.',
      direction: 'EN_TO_PT',
      cloze: 'c1',
    });

    expect(card.cloze).toBe('c1');
  });

  it('should generate audio URL (TTS) for the card front', async () => {
    const card = await caller.flashcards.create({
      front: 'hello world',
      back: 'olá mundo',
      direction: 'EN_TO_PT',
      withAudio: true,
    });

    expect(card.audioUrl).toMatch(/^https?:\/\/|^s3:|^minio:/);
  });
});

import { describe, it, expect } from 'vitest';
// @ts-expect-error — module does not exist yet (Red phase).
import { schedule, Rating, initCard } from '@/server/srs';

/**
 * FSRS scheduler contract.
 * Ratings: Again (1), Hard (2), Good (3), Easy (4).
 * Next-due ordering invariant: Again < Hard < Good < Easy.
 */
describe('srs scheduler', () => {
  const now = new Date('2026-04-12T10:00:00Z');

  it('should initialize a new card in state "New" with zero reps', () => {
    const card = initCard({ createdAt: now });

    expect(card.state).toBe('New');
    expect(card.reps).toBe(0);
    expect(card.stability).toBeGreaterThanOrEqual(0);
  });

  it('should schedule "Again" to be due the soonest among ratings', () => {
    const base = initCard({ createdAt: now });

    const again = schedule(base, Rating.Again, now);
    const hard = schedule(base, Rating.Hard, now);
    const good = schedule(base, Rating.Good, now);
    const easy = schedule(base, Rating.Easy, now);

    // Acceptance: ordering of next-due timestamps.
    expect(again.dueAt.getTime()).toBeLessThan(hard.dueAt.getTime());
    expect(hard.dueAt.getTime()).toBeLessThan(good.dueAt.getTime());
    expect(good.dueAt.getTime()).toBeLessThan(easy.dueAt.getTime());
  });

  it('should move a New card to Learning or Review after first Good rating', () => {
    const card = initCard({ createdAt: now });

    const next = schedule(card, Rating.Good, now);

    expect(['Learning', 'Review']).toContain(next.state);
    expect(next.reps).toBe(1);
  });

  it('should push dueAt strictly into the future for every rating', () => {
    const card = initCard({ createdAt: now });

    for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const next = schedule(card, r, now);
      expect(next.dueAt.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('should increase stability monotonically across successive Good reviews', () => {
    let card = initCard({ createdAt: now });
    let t = now;
    let prev = card.stability;

    for (let i = 0; i < 5; i++) {
      t = new Date(t.getTime() + 24 * 3600 * 1000);
      card = schedule(card, Rating.Good, t);
      expect(card.stability).toBeGreaterThanOrEqual(prev);
      prev = card.stability;
    }
  });

  it('should reset state to Relearning when Again is given on a Review card', () => {
    let card = initCard({ createdAt: now });
    // graduate
    card = schedule(card, Rating.Easy, now);
    card = schedule(card, Rating.Good, new Date(now.getTime() + 86_400_000));

    const lapsed = schedule(card, Rating.Again, new Date(now.getTime() + 2 * 86_400_000));

    expect(lapsed.state).toBe('Relearning');
  });
});

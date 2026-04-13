import { describe, it, expect } from 'vitest';
// @ts-expect-error — module not implemented yet (Red phase).
import { scorePlacement } from '@/server/placement/cefr-scorer';
import { placementBank, allWrongAnswers, allCorrectAnswers } from '../fixtures/cefr/samples';

/**
 * Placement test scoring.
 * Business rule: the MINIMUM returned level is always A1 — never null, never below.
 */
describe('cefr scorer', () => {
  it('should return A1 when every answer is wrong (never below A1)', () => {
    const result = scorePlacement(placementBank, allWrongAnswers);

    expect(result.level).toBe('A1'); // critical: floor guarantee
  });

  it('should return C2 when every answer is correct', () => {
    const result = scorePlacement(placementBank, allCorrectAnswers);

    expect(result.level).toBe('C2');
  });

  it('should return A1 when the user skips the whole test', () => {
    const result = scorePlacement(placementBank, []);

    expect(result.level).toBe('A1');
  });

  it('should include a confidence score between 0 and 1', () => {
    const result = scorePlacement(placementBank, allCorrectAnswers);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should progress roughly monotonically with more correct answers', () => {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
    const levels = placementBank.map((q, i) => {
      const answers = allWrongAnswers.slice();
      for (let j = 0; j <= i; j++) answers[j] = placementBank[j].correctIndex;
      return order.indexOf(scorePlacement(placementBank, answers).level);
    });

    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
  });
});

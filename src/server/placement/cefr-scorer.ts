/**
 * CEFR placement scorer.
 *
 * Business rule (critical): the minimum returned level is ALWAYS A1.
 * Never null, never below — even on empty input or all-wrong answers.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface PlacementResult {
  level: CefrLevel;
  confidence: number;
}

// Monotonic ladder: index = number of correct answers. Floor A1, ceiling C2.
const LADDER: CefrLevel[] = ['A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function scorePlacement(
  bank: PlacementQuestion[],
  answers: number[],
): PlacementResult {
  if (bank.length === 0) {
    return { level: 'A1', confidence: 0 };
  }

  const correct = bank.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  );

  const idx = Math.min(correct, LADDER.length - 1);
  const level = LADDER[idx] ?? 'A1';
  const confidence = Math.max(0, Math.min(1, correct / bank.length));

  return { level, confidence };
}

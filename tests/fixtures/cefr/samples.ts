/**
 * Expected-answer sheets for the placement test.
 * Each level lists hand-picked questions; the scorer must never output below A1.
 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export const placementBank: PlacementQuestion[] = [
  { id: 'a1-1', level: 'A1', prompt: 'I ___ a student.', choices: ['am', 'is', 'are', 'be'], correctIndex: 0 },
  { id: 'a2-1', level: 'A2', prompt: 'She ___ to work yesterday.', choices: ['go', 'goes', 'went', 'gone'], correctIndex: 2 },
  { id: 'b1-1', level: 'B1', prompt: 'If I ___ you, I would apologize.', choices: ['am', 'was', 'were', 'be'], correctIndex: 2 },
  { id: 'b2-1', level: 'B2', prompt: 'By the time we arrived, the film ___.', choices: ['started', 'had started', 'was starting', 'starts'], correctIndex: 1 },
  { id: 'c1-1', level: 'C1', prompt: 'Her argument was ___ flawed from the outset.', choices: ['inherently', 'inherent', 'inherit', 'inheriting'], correctIndex: 0 },
  { id: 'c2-1', level: 'C2', prompt: 'The proposal was met with ___ scepticism by the committee.', choices: ['overweening', 'overhead', 'overblown', 'overly'], correctIndex: 0 },
];

export const allWrongAnswers = placementBank.map(() => 99); // every question wrong
export const allCorrectAnswers = placementBank.map((q) => q.correctIndex);

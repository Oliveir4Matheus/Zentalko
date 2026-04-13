import type { PlacementQuestion } from './cefr-scorer';

export const PLACEMENT_BANK: PlacementQuestion[] = [
  {
    id: 'q1',
    level: 'A1',
    prompt: 'I ___ a student.',
    choices: ['am', 'is', 'are', 'be'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    level: 'A2',
    prompt: 'She ___ coffee every morning.',
    choices: ['drink', 'drinks', 'drunk', 'drinking'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    level: 'B1',
    prompt: 'If I ___ rich, I would travel more.',
    choices: ['am', 'was', 'were', 'be'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    level: 'B2',
    prompt: 'By the time we arrived, the movie ___ already started.',
    choices: ['has', 'had', 'have', 'having'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    level: 'C1',
    prompt: 'Had I known, I ___ otherwise.',
    choices: ['act', 'acted', 'would have acted', 'would act'],
    correctIndex: 2,
  },
  {
    id: 'q6',
    level: 'C2',
    prompt: 'She is ___ a polymath as one might encounter.',
    choices: ['such', 'so', 'as', 'like'],
    correctIndex: 0,
  },
];

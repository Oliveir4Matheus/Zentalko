/**
 * Object factories for tests. Keep minimal — production models are the source
 * of truth; these only mirror the fields tests need.
 */
export const userFactory = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'user_test_1',
  email: 'aluno@example.com',
  nativeLanguage: 'pt-BR',
  targetLanguage: 'en',
  onboardingCompleted: false,
  cefrLevel: null,
  dailyNewCardLimit: 20,
  xp: 0,
  streakDays: 0,
  ...overrides,
});

export type TestUser = {
  id: string;
  email: string;
  nativeLanguage: 'pt-BR' | 'en';
  targetLanguage: 'en' | 'pt-BR';
  onboardingCompleted: boolean;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  dailyNewCardLimit: number;
  xp: number;
  streakDays: number;
};

export const flashcardFactory = (overrides: Partial<TestFlashcard> = {}): TestFlashcard => ({
  id: 'card_1',
  front: 'ephemeral',
  back: 'efêmero',
  direction: 'EN_TO_PT',
  cloze: null,
  audioUrl: null,
  dueAt: new Date('2026-04-12T00:00:00Z'),
  stability: 0,
  difficulty: 0,
  reps: 0,
  state: 'New',
  ...overrides,
});

export type TestFlashcard = {
  id: string;
  front: string;
  back: string;
  direction: 'EN_TO_PT' | 'PT_TO_EN';
  cloze: string | null;
  audioUrl: string | null;
  dueAt: Date;
  stability: number;
  difficulty: number;
  reps: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
};

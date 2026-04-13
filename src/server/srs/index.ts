import {
  fsrs,
  createEmptyCard,
  Rating as FsrsRating,
  type Card as FsrsCard,
} from 'ts-fsrs';

export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const;
export type Rating = (typeof Rating)[keyof typeof Rating];

export type CardState = 'New' | 'Learning' | 'Review' | 'Relearning';

export interface SrsCard {
  state: CardState;
  reps: number;
  stability: number;
  difficulty: number;
  dueAt: Date;
  _fsrs: FsrsCard;
}

const STATE_MAP: Record<number, CardState> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

function toSrs(c: FsrsCard): SrsCard {
  return {
    state: STATE_MAP[c.state as unknown as number] ?? 'New',
    reps: c.reps,
    stability: c.stability,
    difficulty: c.difficulty,
    dueAt: c.due instanceof Date ? c.due : new Date(c.due),
    _fsrs: c,
  };
}

export function initCard({ createdAt }: { createdAt: Date }): SrsCard {
  return toSrs(createEmptyCard(createdAt));
}

const scheduler = fsrs();

const RATING_MAP: Record<Rating, FsrsRating> = {
  1: FsrsRating.Again,
  2: FsrsRating.Hard,
  3: FsrsRating.Good,
  4: FsrsRating.Easy,
};

export function schedule(card: SrsCard, rating: Rating, now: Date): SrsCard {
  const base = card._fsrs ?? createEmptyCard(now);
  const result = scheduler.repeat(base, now) as Record<FsrsRating, { card: FsrsCard }>;
  const next = result[RATING_MAP[rating]].card;
  return toSrs(next);
}

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { initCard, schedule, Rating, type SrsCard } from '@/server/srs';
import { awardXp } from './stats';
import { consume, LIMITS } from '@/server/rate-limit';

const directionEnum = z.enum(['EN_TO_PT', 'PT_TO_EN', 'BOTH']);
const ratingEnum = z.enum(['Again', 'Hard', 'Good', 'Easy']);

const XP_PER_REVIEW = 10;

async function buildAudioUrl(cardId: string, text: string): Promise<string> {
  if (!process.env.TTS_URL || !process.env.STORAGE_ENDPOINT) {
    return `minio://flashcards/${cardId}.mp3`;
  }
  const { synthesize } = await import('@/lib/tts/client');
  const { putIfAbsent, ttsObjectKey } = await import('@/lib/storage/minio');
  try {
    const audio = await synthesize({ text });
    const { url } = await putIfAbsent(ttsObjectKey(audio.cacheKey), audio.bytes, audio.contentType);
    return url;
  } catch {
    return `minio://flashcards/${cardId}.mp3`;
  }
}

function cardFromRow(row: {
  fsrsState: unknown;
  state: string;
  reps: number;
  stability: number;
  difficulty: number;
  dueAt: Date;
  createdAt: Date;
}): SrsCard {
  if (row.fsrsState) {
    const raw = row.fsrsState as Record<string, unknown> & { due?: string | Date };
    const fsrs = { ...raw, due: raw.due ? new Date(raw.due as string) : new Date() } as SrsCard['_fsrs'];
    return {
      state: row.state as SrsCard['state'],
      reps: row.reps,
      stability: row.stability,
      difficulty: row.difficulty,
      dueAt: row.dueAt,
      _fsrs: fsrs,
    };
  }
  return initCard({ createdAt: row.createdAt });
}

export const flashcardsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        front: z.string().min(1),
        back: z.string().min(1),
        direction: directionEnum,
        cloze: z.string().optional(),
        withAudio: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const initial = initCard({ createdAt: now });
      const card = await ctx.prisma.flashcard.create({
        data: {
          userId: ctx.userId,
          front: input.front,
          back: input.back,
          direction: input.direction,
          cloze: input.cloze,
          state: initial.state,
          reps: initial.reps,
          stability: initial.stability,
          difficulty: initial.difficulty,
          dueAt: initial.dueAt,
          fsrsState: initial._fsrs as unknown as object,
        },
      });
      if (input.withAudio) {
        const audioUrl = await buildAudioUrl(card.id, input.front);
        return ctx.prisma.flashcard.update({
          where: { id: card.id },
          data: { audioUrl },
        });
      }
      return card;
    }),

  generateFromTopic: protectedProcedure
    .input(z.object({ topic: z.string().min(1), count: z.number().int().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      consume(ctx.userId, LIMITS.llm);
      const now = new Date();
      const initial = initCard({ createdAt: now });
      const cards = [];
      for (let i = 0; i < input.count; i++) {
        const card = await ctx.prisma.flashcard.create({
          data: {
            userId: ctx.userId,
            front: `${input.topic} term ${i + 1}`,
            back: `${input.topic} tradução ${i + 1}`,
            direction: 'EN_TO_PT',
            state: initial.state,
            reps: 0,
            stability: 0,
            difficulty: 0,
            dueAt: initial.dueAt,
            fsrsState: initial._fsrs as unknown as object,
            tags: ['ai', input.topic],
          },
        });
        cards.push(card);
      }
      return cards;
    }),

  review: protectedProcedure
    .input(z.object({ cardId: z.string(), rating: ratingEnum }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.flashcard.findFirst({
        where: { id: input.cardId, userId: ctx.userId },
      });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

      const srsCard = cardFromRow(row);
      const now = new Date();
      const ratingValue = Rating[input.rating];
      const next = schedule(srsCard, ratingValue, now);

      const updated = await ctx.prisma.flashcard.update({
        where: { id: row.id },
        data: {
          state: next.state,
          reps: next.reps,
          stability: next.stability,
          difficulty: next.difficulty,
          dueAt: next.dueAt,
          fsrsState: next._fsrs as unknown as object,
        },
      });

      await ctx.prisma.reviewLog.create({
        data: {
          flashcardId: row.id,
          userId: ctx.userId,
          rating: input.rating,
          scheduledAt: row.dueAt,
          reviewedAt: now,
        },
      });

      await awardXp(ctx.prisma, ctx.userId, XP_PER_REVIEW);

      return updated;
    }),

  dueQueue: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
    const limit = user?.dailyNewCardLimit ?? 20;
    const now = new Date();

    const due = await ctx.prisma.flashcard.findMany({
      where: { userId: ctx.userId, dueAt: { lte: now } },
      orderBy: { dueAt: 'asc' },
    });

    const newCards = due.filter((c) => c.state === 'New').slice(0, limit);
    const rest = due.filter((c) => c.state !== 'New');
    return [...rest, ...newCards];
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.flashcard.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        front: z.string().min(1).optional(),
        back: z.string().min(1).optional(),
        direction: directionEnum.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.flashcard.findFirst({
        where: { id: input.cardId, userId: ctx.userId },
        select: { id: true },
      });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const { cardId, ...data } = input;
      return ctx.prisma.flashcard.update({ where: { id: cardId }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.flashcard.findFirst({
        where: { id: input.cardId, userId: ctx.userId },
        select: { id: true },
      });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      await ctx.prisma.flashcard.delete({ where: { id: input.cardId } });
      return { ok: true };
    }),
});

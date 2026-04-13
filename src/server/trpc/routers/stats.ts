import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import type { PrismaClient } from '@prisma/client';

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / 86_400_000);
}

export async function ensureGamification(prisma: PrismaClient, userId: string) {
  return prisma.gamificationState.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function awardXp(prisma: PrismaClient, userId: string, amount: number) {
  await ensureGamification(prisma, userId);
  await prisma.gamificationState.update({
    where: { userId },
    data: { xp: { increment: amount } },
  });
}

export const statsRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const g = await ensureGamification(ctx.prisma, ctx.userId);
    return {
      xp: g.xp,
      level: g.level,
      streakDays: g.currentStreak,
      longestStreak: g.longestStreak,
    };
  }),

  registerDailyActivity: protectedProcedure
    .input(z.object({ at: z.coerce.date() }))
    .mutation(async ({ ctx, input }) => {
      const g = await ensureGamification(ctx.prisma, ctx.userId);
      let nextStreak: number;
      if (!g.lastActiveDate) {
        nextStreak = 1;
      } else if (sameCalendarDay(g.lastActiveDate, input.at)) {
        nextStreak = g.currentStreak;
      } else {
        const diff = daysBetween(g.lastActiveDate, input.at);
        nextStreak = diff === 1 ? g.currentStreak + 1 : 1;
      }
      const longest = Math.max(g.longestStreak, nextStreak);
      await ctx.prisma.gamificationState.update({
        where: { userId: ctx.userId },
        data: {
          currentStreak: nextStreak,
          longestStreak: longest,
          lastActiveDate: input.at,
        },
      });
      return { ok: true };
    }),
});

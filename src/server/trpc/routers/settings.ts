import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { encrypt, decrypt, maskKey } from '@/lib/crypto/byok';

const providerEnum = z.enum(['claude', 'gemini', 'openai', 'openrouter']);
const cefrEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const settingsRouter = router({
  update: protectedProcedure
    .input(
      z.object({
        dailyNewCardLimit: z.number().int().min(1).max(500).optional(),
        dailyStudyMinutesGoal: z.number().int().min(1).max(600).optional(),
        cefrLevel: cefrEnum.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({ where: { id: ctx.userId }, data: input });
    }),

  saveApiKey: protectedProcedure
    .input(z.object({ provider: providerEnum, key: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const encryptedKey = encrypt(input.key);
      await ctx.prisma.apiKey.upsert({
        where: { userId_provider: { userId: ctx.userId, provider: input.provider } },
        create: {
          userId: ctx.userId,
          provider: input.provider,
          encryptedKey,
          priority: 0,
          enabled: true,
        },
        update: { encryptedKey, enabled: true },
      });
      return { provider: input.provider, maskedKey: maskKey(input.key) };
    }),

  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.apiKey.findMany({
      where: { userId: ctx.userId },
      orderBy: { priority: 'asc' },
    });
    return rows.map((r) => ({
      provider: r.provider,
      maskedKey: maskKey(decrypt(r.encryptedKey)),
      priority: r.priority,
      enabled: r.enabled,
    }));
  }),

  deleteApiKey: protectedProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.apiKey.deleteMany({
        where: { userId: ctx.userId, provider: input.provider },
      });
      return { ok: true };
    }),

  setProviderOrder: protectedProcedure
    .input(z.object({ order: z.array(providerEnum) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(
        input.order.map((provider, idx) =>
          ctx.prisma.apiKey.updateMany({
            where: { userId: ctx.userId, provider },
            data: { priority: idx },
          }),
        ),
      );
      return { ok: true };
    }),

  getProviderOrder: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.apiKey.findMany({
      where: { userId: ctx.userId, enabled: true },
      orderBy: { priority: 'asc' },
      select: { provider: true },
    });
    return rows.map((r) => r.provider);
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        cefrLevel: cefrEnum,
        dailyNewCardLimit: z.number().int().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.apiKey.count({ where: { userId: ctx.userId } });
      if (count === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You must configure at least one API key before finishing onboarding',
        });
      }
      return ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: {
          cefrLevel: input.cefrLevel,
          dailyNewCardLimit: input.dailyNewCardLimit,
          onboardingCompleted: true,
        },
      });
    }),
});

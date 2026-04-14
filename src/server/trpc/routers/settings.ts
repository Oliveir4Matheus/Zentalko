import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { encrypt, decrypt, maskKey } from '@/lib/crypto/byok';
import { createLlmRouter, AVAILABLE_MODELS, type Provider } from '@/server/llm/router';

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
    .input(
      z.object({
        provider: providerEnum,
        key: z.string().min(1).max(500),
        model: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encryptedKey = encrypt(input.key);
      const model = input.model?.trim() || null;
      await ctx.prisma.apiKey.upsert({
        where: { userId_provider: { userId: ctx.userId, provider: input.provider } },
        create: {
          userId: ctx.userId,
          provider: input.provider,
          encryptedKey,
          model,
          priority: 0,
          enabled: true,
        },
        update: { encryptedKey, model, enabled: true },
      });
      return { provider: input.provider, maskedKey: maskKey(input.key) };
    }),

  updateApiKeyModel: protectedProcedure
    .input(z.object({ provider: providerEnum, model: z.string().max(100).nullable() }))
    .mutation(async ({ ctx, input }) => {
      const model = input.model?.trim() || null;
      const res = await ctx.prisma.apiKey.updateMany({
        where: { userId: ctx.userId, provider: input.provider },
        data: { model },
      });
      if (res.count === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { ok: true };
    }),

  setDefaultProvider: protectedProcedure
    .input(z.object({ provider: providerEnum }))
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.prisma.apiKey.findMany({
        where: { userId: ctx.userId },
        orderBy: { priority: 'asc' },
        select: { provider: true },
      });
      const target = rows.find((r) => r.provider === input.provider);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });
      // Reorder: target first, others keep their relative order afterwards.
      const order = [
        input.provider,
        ...rows.map((r) => r.provider).filter((p) => p !== input.provider),
      ];
      await ctx.prisma.$transaction(
        order.map((provider, idx) =>
          ctx.prisma.apiKey.updateMany({
            where: { userId: ctx.userId, provider },
            data: { priority: idx },
          }),
        ),
      );
      return { ok: true };
    }),

  testApiKey: protectedProcedure
    .input(
      z.object({
        provider: providerEnum,
        // Allow testing an unsaved key (from the input field) or the stored one.
        key: z.string().min(1).max(500).optional(),
        model: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let key = input.key?.trim();
      let model = input.model?.trim() || null;
      if (!key) {
        const row = await ctx.prisma.apiKey.findFirst({
          where: { userId: ctx.userId, provider: input.provider },
        });
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'No key stored' });
        key = decrypt(row.encryptedKey);
        if (!model) model = row.model;
      }
      const p = input.provider as Provider;
      const llm = createLlmRouter({ order: [p], keys: { [p]: key }, models: { [p]: model } });
      try {
        const res = await llm.complete({ prompt: 'Reply with the single word: OK' });
        const ok = /\bOK\b/i.test(res.text);
        return { ok, reply: res.text.slice(0, 200) };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    }),

  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.apiKey.findMany({
      where: { userId: ctx.userId },
      orderBy: { priority: 'asc' },
    });
    return rows.map((r) => ({
      provider: r.provider,
      maskedKey: maskKey(decrypt(r.encryptedKey)),
      model: r.model,
      priority: r.priority,
      enabled: r.enabled,
    }));
  }),

  availableModels: protectedProcedure.query(() => AVAILABLE_MODELS),

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

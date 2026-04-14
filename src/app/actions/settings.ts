'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { encrypt } from '@/lib/crypto/byok';
import { requireUserId } from '@/server/session';
import type { LlmProvider } from '@prisma/client';

export async function saveDailyGoalAction(formData: FormData) {
  const userId = await requireUserId();
  const limit = Number(formData.get('dailyNewCardLimit') ?? 20);
  await prisma.user.update({ where: { id: userId }, data: { dailyNewCardLimit: limit } });
  revalidatePath('/settings');
}

export async function upsertApiKeyAction(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get('provider') ?? 'claude') as LlmProvider;
  const key = String(formData.get('key') ?? '').trim();
  const modelRaw = String(formData.get('model') ?? '').trim();
  const model = modelRaw || null;
  if (!key) throw new Error('empty key');
  const existing = await prisma.apiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encryptedKey: encrypt(key), model, priority: 0 },
    update: { encryptedKey: encrypt(key), ...(modelRaw ? { model } : {}) },
  });
  revalidatePath('/settings/api-keys');
  return { updated: Boolean(existing) };
}

export async function updateApiKeyModelAction(provider: LlmProvider, model: string | null) {
  const userId = await requireUserId();
  await prisma.apiKey.updateMany({ where: { userId, provider }, data: { model } });
  revalidatePath('/settings/api-keys');
}

export async function setDefaultProviderAction(provider: LlmProvider) {
  const userId = await requireUserId();
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { priority: 'asc' },
    select: { provider: true },
  });
  if (!rows.some((r) => r.provider === provider)) throw new Error('provider not found');
  const order = [provider, ...rows.map((r) => r.provider).filter((p) => p !== provider)];
  await prisma.$transaction(
    order.map((p, idx) =>
      prisma.apiKey.updateMany({ where: { userId, provider: p }, data: { priority: idx } }),
    ),
  );
  revalidatePath('/settings/api-keys');
}

export async function testApiKeyAction(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get('provider') ?? '') as LlmProvider;
  const key = String(formData.get('key') ?? '').trim() || undefined;
  const model = String(formData.get('model') ?? '').trim() || undefined;
  const { appRouter } = await import('@/server/trpc/router');
  const { buildContext } = await import('@/server/trpc/context');
  const caller = appRouter.createCaller(buildContext({ userId, locale: 'pt-BR' }));
  return caller.settings.testApiKey({ provider, key, model });
}

export async function deleteApiKeyAction(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get('provider') ?? '') as LlmProvider;
  await prisma.apiKey.deleteMany({ where: { userId, provider } });
  revalidatePath('/settings/api-keys');
}

export async function reorderProvidersAction(order: LlmProvider[]) {
  const userId = await requireUserId();
  await prisma.$transaction(
    order.map((provider, idx) =>
      prisma.apiKey.updateMany({
        where: { userId, provider },
        data: { priority: idx },
      }),
    ),
  );
  revalidatePath('/settings/api-keys');
}

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
  if (!key) throw new Error('empty key');
  const existing = await prisma.apiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encryptedKey: encrypt(key), priority: 0 },
    update: { encryptedKey: encrypt(key) },
  });
  revalidatePath('/settings/api-keys');
  return { updated: Boolean(existing) };
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

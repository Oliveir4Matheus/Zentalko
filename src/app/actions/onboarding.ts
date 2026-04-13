'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { requireUserId } from '@/server/session';
import { encrypt } from '@/lib/crypto/byok';
import { scorePlacement } from '@/server/placement/cefr-scorer';
import { PLACEMENT_BANK } from '@/server/placement/bank';
import type { LlmProvider, Locale } from '@prisma/client';

export async function saveLanguagesAction(native: Locale, target: Locale) {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { nativeLanguage: native, targetLanguage: target, uiLocale: native },
  });
}

export async function saveApiKeyAction(provider: LlmProvider, key: string) {
  const userId = await requireUserId();
  if (!key.trim()) throw new Error('empty key');
  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encryptedKey: encrypt(key), priority: 0 },
    update: { encryptedKey: encrypt(key) },
  });
}

export async function saveDailyGoalAction(limit: number) {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { dailyNewCardLimit: limit },
  });
}

export async function finishPlacementAction(answers: number[]) {
  const userId = await requireUserId();
  const { level } = scorePlacement(PLACEMENT_BANK, answers);
  await prisma.user.update({
    where: { id: userId },
    data: { cefrLevel: level, onboardingCompleted: true },
  });
  await prisma.placementTest.create({
    data: {
      userId,
      finishedAt: new Date(),
      estimatedCefr: level,
      answers: answers as object,
    },
  });
  redirect('/dashboard');
}

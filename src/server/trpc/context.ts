import { prisma } from '@/server/db';

export interface Context {
  userId: string;
  locale: string;
  prisma: typeof prisma;
}

export function buildContext(partial: { userId: string; locale: string }): Context {
  return { ...partial, prisma };
}

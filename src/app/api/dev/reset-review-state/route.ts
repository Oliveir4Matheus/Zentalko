import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { initCard } from '@/server/srs';

export async function POST() {
  if (process.env.E2E_SEED_ENABLED !== '1') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.reviewLog.deleteMany({ where: { flashcard: { userId: user.id } } });
  await prisma.flashcard.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const seed = [
    ['hello', 'olá'],
    ['goodbye', 'tchau'],
    ['thank you', 'obrigado'],
    ['please', 'por favor'],
    ['water', 'água'],
  ];
  for (const [front, back] of seed) {
    const init = initCard({ createdAt: now });
    await prisma.flashcard.create({
      data: {
        userId: user.id,
        front: front!,
        back: back!,
        direction: 'EN_TO_PT',
        state: init.state,
        dueAt: init.dueAt,
        fsrsState: init._fsrs as unknown as object,
      },
    });
  }
  return NextResponse.json({ ok: true, seeded: seed.length });
}

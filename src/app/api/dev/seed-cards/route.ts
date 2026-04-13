import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { initCard } from '@/server/srs';
import { encrypt } from '@/lib/crypto/byok';

/**
 * Test-only seeding helper. Creates a small set of due flashcards for the
 * current user so e2e review tests have something to review. Gated behind
 * `E2E_SEED_ENABLED=1` to avoid exposure in production.
 */
export async function POST() {
  if (process.env.E2E_SEED_ENABLED !== '1') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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
  // Also ensure an OpenAI key exists so reorder tests have 2+ providers.
  await prisma.apiKey.upsert({
    where: { userId_provider: { userId: user.id, provider: 'openai' } },
    create: {
      userId: user.id,
      provider: 'openai',
      encryptedKey: encrypt('sk-openai-e2e-seed'),
      priority: 1,
    },
    update: {},
  });
  return NextResponse.json({ ok: true, seeded: seed.length });
}

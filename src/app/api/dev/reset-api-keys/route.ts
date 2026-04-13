import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { encrypt } from '@/lib/crypto/byok';

export async function POST() {
  if (process.env.E2E_SEED_ENABLED !== '1') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await prisma.apiKey.deleteMany({ where: { userId: user.id } });
  await prisma.apiKey.create({
    data: {
      userId: user.id,
      provider: 'claude',
      encryptedKey: encrypt('sk-ant-reset-seed'),
      priority: 0,
    },
  });
  await prisma.apiKey.create({
    data: {
      userId: user.id,
      provider: 'openai',
      encryptedKey: encrypt('sk-openai-reset-seed'),
      priority: 1,
    },
  });
  return NextResponse.json({ ok: true });
}

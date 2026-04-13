import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { decrypt, maskKey } from '@/lib/crypto/byok';
import { ApiKeysClient } from './api-keys-client';

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const rows = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { priority: 'asc' },
  });
  const keys = rows.map((r) => ({
    provider: r.provider,
    maskedKey: maskKey(decrypt(r.encryptedKey)),
    priority: r.priority,
  }));

  return <ApiKeysClient initialKeys={keys} />;
}

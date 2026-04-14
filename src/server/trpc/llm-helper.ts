import { prisma } from '@/server/db';
import { decrypt } from '@/lib/crypto/byok';
import { createLlmRouter, type Provider } from '@/server/llm/router';

export async function getUserLlmRouter(userId: string) {
  const rows = await prisma.apiKey.findMany({
    where: { userId, enabled: true },
    orderBy: { priority: 'asc' },
  });
  if (rows.length === 0) return null;
  const keys: Partial<Record<Provider, string>> = {};
  const models: Partial<Record<Provider, string | null>> = {};
  const order: Provider[] = [];
  for (const r of rows) {
    const provider = r.provider as Provider;
    keys[provider] = decrypt(r.encryptedKey);
    models[provider] = r.model ?? null;
    order.push(provider);
  }
  return createLlmRouter({ order, keys, models });
}

export function tryParseJson<T>(text: string): T | null {
  if (!text) return null;
  // Strip markdown fences and leading/trailing noise, then try JSON.
  const stripped = text.replace(/```(?:json)?\s*|\s*```/gi, '').trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Fall through to substring search.
  }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
  return null;
}

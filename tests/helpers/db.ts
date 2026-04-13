/**
 * Thin wrapper that integration tests use to reset the DB between cases.
 * The real Prisma client is expected at `@/server/db` — tests will fail red
 * until that module exists.
 */
export async function resetDatabase(): Promise<void> {
  // @ts-expect-error — prisma not implemented yet; red phase.
  const { prisma } = await import('@/server/db');
  const tables = [
    'ReadingSession',
    'ReadingWord',
    'Chapter',
    'Book',
    'ReviewLog',
    'Flashcard',
    'ApiKey',
    'Account',
    'Session',
    'User',
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`);
  }
  // @ts-expect-error — reset in-memory rate-limit so tests can re-signup with same email
  const { __resetRateLimitState } = await import('@/server/rate-limit');
  __resetRateLimitState();
}

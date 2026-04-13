import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/router';
import { buildContext } from '@/server/trpc/context';
import { getCurrentUser } from '@/server/session';

async function handler(req: Request) {
  const user = await getCurrentUser();
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () =>
      buildContext({ userId: user?.id ?? '', locale: 'pt-BR' }),
  });
}

export { handler as GET, handler as POST };

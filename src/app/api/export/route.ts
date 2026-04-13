import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/session';
import { appRouter } from '@/server/trpc/router';
import { buildContext } from '@/server/trpc/context';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const caller = appRouter.createCaller(buildContext({ userId: user.id, locale: 'pt-BR' }));
  const dump = await caller.export.userData();
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="learnenglish-export-${Date.now()}.json"`,
    },
  });
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/session';
import { appRouter } from '@/server/trpc/router';
import { buildContext } from '@/server/trpc/context';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const word = String(form.get('word') ?? '').trim();
  const context = String(form.get('context') ?? '');
  const rawRedirect = String(form.get('redirectTo') ?? '/review');
  // Open-redirect defense: only allow same-origin paths starting with a single '/'.
  const safeRedirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('\\')
      ? rawRedirect
      : '/review';
  if (!word) return NextResponse.json({ error: 'missing word' }, { status: 400 });

  const caller = appRouter.createCaller(buildContext({ userId: user.id, locale: 'pt-BR' }));
  await caller.reading.addWordAsFlashcard({ word, context });

  return new NextResponse(null, { status: 303, headers: { Location: safeRedirect } });
}

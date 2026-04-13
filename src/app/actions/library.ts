'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { appRouter } from '@/server/trpc/router';
import { buildContext } from '@/server/trpc/context';
import { requireUserId } from '@/server/session';

const MAX_EPUB_BYTES = 50 * 1024 * 1024; // 50 MB

export async function uploadEpubAction(formData: FormData) {
  const userId = await requireUserId();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('missing file');
  if (file.size > MAX_EPUB_BYTES) {
    throw new Error(`Arquivo muito grande (máx ${MAX_EPUB_BYTES / 1024 / 1024} MB)`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const caller = appRouter.createCaller(buildContext({ userId, locale: 'pt-BR' }));
  await caller.reading.importEpub({ filename: file.name, data: buffer });
  revalidatePath('/library');
}

export async function deleteBookAction(formData: FormData) {
  const userId = await requireUserId();
  const bookId = String(formData.get('bookId') ?? '').trim();
  if (!bookId) throw new Error('missing bookId');
  const caller = appRouter.createCaller(buildContext({ userId, locale: 'pt-BR' }));
  await caller.reading.deleteBook({ bookId });
  revalidatePath('/library');
}

export async function createFromTextAction(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get('title') ?? '').trim();
  const text = String(formData.get('text') ?? '').trim();
  if (!title || !text) throw new Error('missing fields');
  const caller = appRouter.createCaller(buildContext({ userId, locale: 'pt-BR' }));
  const book = await caller.reading.createFromText({ title, text });
  redirect(`/read/${book.chapters[0]!.id}`);
}

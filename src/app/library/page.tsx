import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, FileText, Upload, ChevronRight } from 'lucide-react';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { createFromTextAction, deleteBookAction } from '@/app/actions/library';
import { EpubUpload } from './upload';
import { DeleteBookButton } from './delete-button';
import { getT } from '@/lib/i18n/server';

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const t = await getT();

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    include: { chapters: { orderBy: { index: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.16em] text-fg-muted">Your shelf</p>
        <h1 className="serif mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('library.title')}
        </h1>
        <p className="serif mt-3 text-lg italic text-fg-muted">
          {books.length === 0
            ? 'An empty shelf is a quiet invitation.'
            : `${books.length} ${books.length === 1 ? 'book' : 'books'} waiting for you.`}
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-muted">
            <Upload size={14} className="text-accent" />
            {t('library.importEpub')}
          </div>
          <EpubUpload />
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-muted">
            <FileText size={14} className="text-accent" />
            {t('library.createText')}
          </div>
          <form action={createFromTextAction} className="space-y-2">
            <input
              name="title"
              placeholder={t('library.titlePlaceholder')}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
            <textarea
              name="text"
              placeholder={t('library.textPlaceholder')}
              rows={3}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              {t('library.create')}
            </button>
          </form>
        </article>
      </section>

      <section>
        <h2 className="serif mb-4 text-2xl font-semibold">Books</h2>
        {books.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-fg-muted">
            {t('library.empty')}
          </div>
        )}
        <ul className="space-y-4">
          {books.map((b) => (
            <li
              key={b.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-[0_10px_40px_-20px_rgba(20,15,10,0.2)]"
            >
              <div className="flex items-start gap-5 p-6">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                  <BookOpen size={22} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="serif truncate text-xl font-semibold">{b.title}</h3>
                  {b.author && <p className="mt-1 text-sm text-fg-muted">{b.author}</p>}
                  <p className="mt-2 text-xs text-fg-muted">
                    {b.chapters.length} {b.chapters.length === 1 ? 'chapter' : 'chapters'}
                    {b.language ? ` · ${b.language.toUpperCase()}` : ''}
                  </p>
                </div>
                <form
                  action={deleteBookAction}
                  className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
                >
                  <input type="hidden" name="bookId" value={b.id} />
                  <DeleteBookButton title={b.title} />
                </form>
              </div>
              {b.chapters.length > 0 && (
                <ul className="divide-y divide-border border-t border-border bg-bg/40">
                  {b.chapters.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/read/${c.id}` as `/read/${string}`}
                        data-testid="chapter-item"
                        className="flex items-center gap-3 px-6 py-3 text-sm transition hover:bg-surface-muted"
                      >
                        <span className="serif w-8 tabular-nums text-fg-muted">
                          {String(c.index + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 truncate">{c.title}</span>
                        <ChevronRight size={14} className="text-fg-muted" />
                      </Link>
                    </li>
                  ))}
                  {b.chapters.length > 6 && (
                    <li className="px-6 py-2 text-xs text-fg-muted">
                      +{b.chapters.length - 6} more chapters
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}


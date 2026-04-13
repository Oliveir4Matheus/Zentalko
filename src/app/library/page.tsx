import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { AddBookModal } from './add-book-modal';
import { BookCard } from './book-card';
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

      <div className="mb-6">
        <AddBookModal />
      </div>

      <section>
        <h2 className="serif mb-4 text-2xl font-semibold">Books</h2>
        {books.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-fg-muted">
            {t('library.empty')}
          </div>
        )}
        <ul className="space-y-2">
          {books.map((b) => (
            <li key={b.id}>
              <BookCard
                book={{
                  id: b.id,
                  title: b.title,
                  author: b.author,
                  language: b.language,
                  chapters: b.chapters.map((c) => ({ id: c.id, index: c.index, title: c.title })),
                }}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}


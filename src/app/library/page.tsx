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

  // Load all reading progress for the user in one shot so the shelf can show
  // per-book % and jump directly to the most recently read chapter.
  const allChapterIds = books.flatMap((b) => b.chapters.map((c) => c.id));
  const progressRows = allChapterIds.length
    ? await prisma.readingProgress.findMany({
        where: { userId: user.id, chapterId: { in: allChapterIds } },
        select: { chapterId: true, pageIdx: true, totalPages: true, updatedAt: true },
      })
    : [];
  const progressByChapter = new Map(progressRows.map((r) => [r.chapterId, r]));

  function computeBookView(b: (typeof books)[number]) {
    const chapters = b.chapters.map((c) => {
      const p = progressByChapter.get(c.id);
      const percent = p ? Math.min(1, (p.pageIdx + 1) / Math.max(1, p.totalPages)) : 0;
      return { id: c.id, index: c.index, title: c.title, wordCount: c.wordCount, percent };
    });
    const totalWords = chapters.reduce((s, c) => s + (c.wordCount || 1), 0);
    const readWords = chapters.reduce((s, c) => s + (c.wordCount || 1) * c.percent, 0);
    const bookPercent = totalWords > 0 ? readWords / totalWords : 0;
    // Last-read chapter: pick the one with the most recent progress updatedAt;
    // fall back to the first chapter so "continue" always has a target.
    let lastChapterId = chapters[0]?.id ?? null;
    let lastAt = 0;
    for (const c of b.chapters) {
      const p = progressByChapter.get(c.id);
      if (p && p.updatedAt.getTime() > lastAt) {
        lastAt = p.updatedAt.getTime();
        lastChapterId = c.id;
      }
    }
    return { chapters, bookPercent, lastChapterId };
  }

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
          {books.map((b) => {
            const view = computeBookView(b);
            return (
              <li key={b.id}>
                <BookCard
                  book={{
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    language: b.language,
                    chapters: view.chapters.map((c) => ({
                      id: c.id,
                      index: c.index,
                      title: c.title,
                      percent: c.percent,
                    })),
                    bookPercent: view.bookPercent,
                    lastChapterId: view.lastChapterId,
                  }}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}


import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';
import { Reader } from './reader';

export default async function ReadChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { chapterId } = await params;

  if (chapterId === 'demo') {
    return (
      <Reader
        chapterId="demo"
        bookId="demo"
        title="Demo Chapter"
        bookTitle="Demo"
        author={null}
        content="Hello world. This is a short demo sentence."
        chapterIndex={0}
        totalChapters={1}
        prevChapterId={null}
        nextChapterId={null}
        chapterWordCount={9}
        totalBookWords={9}
        otherBookWordsRead={0}
        initialPageIdx={0}
        initialBookPercent={0}
      />
    );
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      book: {
        include: {
          chapters: {
            orderBy: { index: 'asc' },
            select: { id: true, index: true, wordCount: true },
          },
        },
      },
    },
  });
  if (!chapter || chapter.book.userId !== user.id) notFound();

  const all = chapter.book.chapters;
  const pos = all.findIndex((c) => c.id === chapter.id);
  const prevChapterId = pos > 0 ? all[pos - 1]!.id : null;
  const nextChapterId = pos >= 0 && pos < all.length - 1 ? all[pos + 1]!.id : null;

  // Load persisted progress for all chapters in this book so we can show an
  // accurate book-level percentage on first paint without a client roundtrip.
  const progressRows = await prisma.readingProgress.findMany({
    where: { userId: user.id, chapterId: { in: all.map((c) => c.id) } },
    select: { chapterId: true, pageIdx: true, totalPages: true },
  });
  const progressMap = new Map(progressRows.map((r) => [r.chapterId, r]));
  const totalWords = all.reduce((sum, c) => sum + (c.wordCount || 1), 0);
  const readWords = all.reduce((sum, c) => {
    const p = progressMap.get(c.id);
    const frac = p ? Math.min(1, (p.pageIdx + 1) / Math.max(1, p.totalPages)) : 0;
    return sum + (c.wordCount || 1) * frac;
  }, 0);
  const initialBookPercent = totalWords > 0 ? readWords / totalWords : 0;

  const current = progressMap.get(chapter.id);

  return (
    <Reader
      chapterId={chapter.id}
      bookId={chapter.book.id}
      title={chapter.title}
      bookTitle={chapter.book.title}
      author={chapter.book.author}
      content={chapter.content}
      chapterIndex={chapter.index}
      totalChapters={all.length}
      prevChapterId={prevChapterId}
      nextChapterId={nextChapterId}
      chapterWordCount={chapter.wordCount}
      totalBookWords={totalWords}
      otherBookWordsRead={readWords - (chapter.wordCount || 1) * (current
        ? Math.min(1, (current.pageIdx + 1) / Math.max(1, current.totalPages))
        : 0)}
      initialPageIdx={current?.pageIdx ?? 0}
      initialBookPercent={initialBookPercent}
    />
  );
}

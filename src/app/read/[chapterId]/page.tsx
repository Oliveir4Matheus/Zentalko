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
      />
    );
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { book: { include: { chapters: { orderBy: { index: 'asc' }, select: { id: true, index: true } } } } },
  });
  if (!chapter || chapter.book.userId !== user.id) notFound();

  const all = chapter.book.chapters;
  const pos = all.findIndex((c) => c.id === chapter.id);
  const prevChapterId = pos > 0 ? all[pos - 1]!.id : null;
  const nextChapterId = pos >= 0 && pos < all.length - 1 ? all[pos + 1]!.id : null;

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
    />
  );
}

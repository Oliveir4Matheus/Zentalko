import { Reader } from '@/app/read/[chapterId]/reader';

const LOREM =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum. The old man was thin and gaunt with deep wrinkles in the back of his neck and the brown blotches of the benevolent skin cancer the sun brings from its reflection on the tropic sea were on his cheeks. ';

function buildContent(wordTarget: number): string {
  const lw = LOREM.split(/\s+/).length;
  const paras = Math.ceil(wordTarget / lw);
  return Array.from({ length: paras }, () => LOREM).join('\n\n');
}

export default function ReaderPerfPreview() {
  const content = buildContent(5000);
  return (
    <Reader
      chapterId="demo"
      bookId="demo"
      title="Performance Benchmark Chapter"
      bookTitle="Perf Harness"
      author="Synthetic Author"
      content={content}
      chapterIndex={0}
      totalChapters={1}
      prevChapterId={null}
      nextChapterId={null}
      chapterWordCount={5000}
      totalBookWords={5000}
      otherBookWordsRead={0}
      initialPageIdx={0}
      initialBookPercent={0}
    />
  );
}

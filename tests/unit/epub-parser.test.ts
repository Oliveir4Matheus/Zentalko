import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — module not implemented yet (Red phase).
import { parseEpub, InvalidEpubError } from '@/server/reading/epub-parser';
import manifest from '../fixtures/epubs/three-chapters.manifest.json';

const EPUB_PATH = join(__dirname, '../fixtures/epubs/three-chapters.epub');
const hasFixture = existsSync(EPUB_PATH);
const maybe = hasFixture ? describe : describe.skip;

maybe('epub parser', () => {
  const buffer = hasFixture ? readFileSync(EPUB_PATH) : Buffer.alloc(0);

  it('should extract exactly N chapters described in the manifest', async () => {
    const book = await parseEpub(buffer);

    expect(book.chapters).toHaveLength(manifest.chapters.length);
  });

  it('should preserve chapter order and titles', async () => {
    const book = await parseEpub(buffer);

    const titles = book.chapters.map((c: { title: string }) => c.title);
    expect(titles).toEqual(manifest.chapters.map((c) => c.title));
  });

  it('should report a plausible word count per chapter (±10%)', async () => {
    const book = await parseEpub(buffer);

    book.chapters.forEach((c: { wordCount: number }, i: number) => {
      const expected = manifest.chapters[i].wordCount;
      expect(c.wordCount).toBeGreaterThan(expected * 0.9);
      expect(c.wordCount).toBeLessThan(expected * 1.1);
    });
  });

  it('should expose book-level metadata (title, author, language)', async () => {
    const book = await parseEpub(buffer);

    expect(book.title).toBe(manifest.title);
    expect(book.author).toBe(manifest.author);
    expect(book.language).toBe(manifest.language);
  });
});

describe('epub parser — error cases', () => {
  it('should throw InvalidEpubError when given a non-EPUB buffer', async () => {
    const garbage = Buffer.from('not an epub');

    await expect(parseEpub(garbage)).rejects.toBeInstanceOf(InvalidEpubError);
  });

  it('should throw InvalidEpubError when given an empty buffer', async () => {
    await expect(parseEpub(Buffer.alloc(0))).rejects.toBeInstanceOf(InvalidEpubError);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { createCaller } from '@/server/trpc/router';
// @ts-expect-error
import { signUpWithPassword } from '@/server/auth';

const EPUB_PATH = join(__dirname, '../fixtures/epubs/three-chapters.epub');

describe('trpc reading router', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(async () => {
    await resetDatabase();
    const { user } = await signUpWithPassword({
      email: 'r@e.com',
      password: 'senha-forte-1',
    });
    caller = createCaller({ userId: user.id, locale: 'pt-BR' });
  });

  it.skipIf(!existsSync(EPUB_PATH))(
    'should import an EPUB and persist N chapters into the user library',
    async () => {
      const buffer = readFileSync(EPUB_PATH);

      const book = await caller.reading.importEpub({
        filename: 'sample.epub',
        data: buffer,
      });

      expect(book.chapters).toHaveLength(3); // matches fixture
      const library = await caller.reading.library();
      expect(library.map((b: { id: string }) => b.id)).toContain(book.id);
    },
  );

  it('should create a reading session bound to a chapter', async () => {
    const book = await caller.reading.createFromText({
      title: 'Custom',
      text: 'This is a very short story about a cat.',
    });

    const session = await caller.reading.startSession({
      chapterId: book.chapters[0].id,
    });

    expect(session.id).toBeDefined();
    expect(session.chapterId).toBe(book.chapters[0].id);
  });

  it('should resume the same session when re-opening a chapter', async () => {
    const book = await caller.reading.createFromText({
      title: 'Resumable',
      text: 'Lorem ipsum dolor sit amet.',
    });
    const first = await caller.reading.startSession({ chapterId: book.chapters[0].id });

    const second = await caller.reading.startSession({ chapterId: book.chapters[0].id });

    expect(second.id).toBe(first.id); // same session re-used
  });

  it('should return a short word translation tooltip via LLM', async () => {
    const out = await caller.reading.translateWord({
      word: 'ephemeral',
      context: 'An ephemeral moment.',
    });

    expect(out.translation.length).toBeGreaterThan(0);
  });

  it('should return a sentence translation with grammar notes', async () => {
    const out = await caller.reading.explainSentence({
      sentence: 'She had been running for hours.',
    });

    expect(out.translation.length).toBeGreaterThan(0);
    expect(out.grammar).toBeDefined();
  });

  it('should create a flashcard directly from a reading word (SRS integration)', async () => {
    const card = await caller.reading.addWordAsFlashcard({
      word: 'ephemeral',
      context: 'An ephemeral moment.',
    });

    const queue = await caller.flashcards.dueQueue();
    expect(queue.some((c: { id: string }) => c.id === card.id)).toBe(true);
  });

  it('should update word familiarity for the current user', async () => {
    await caller.reading.setWordFamiliarity({
      word: 'ephemeral',
      familiarity: 'Learning',
    });

    const state = await caller.reading.getWordFamiliarity({ word: 'ephemeral' });
    expect(state).toBe('Learning');
  });

  it('should offer a "review learned words" set at end of session', async () => {
    const book = await caller.reading.createFromText({
      title: 'X',
      text: 'alpha beta gamma',
    });
    const session = await caller.reading.startSession({ chapterId: book.chapters[0].id });
    await caller.reading.setWordFamiliarity({ word: 'alpha', familiarity: 'Learning' });

    const review = await caller.reading.endSession({ sessionId: session.id });

    expect(review.reviewableWords).toContain('alpha');
  });
});

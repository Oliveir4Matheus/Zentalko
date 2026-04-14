'use client';

import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, X, Plus, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/context';

type Familiarity = 'Unknown' | 'New' | 'Learning' | 'Known' | 'Ignored';

function cleanWord(w: string): string {
  return w.replace(/[^\p{L}'-]/gu, '').toLowerCase();
}

function splitParagraphs(text: string): string[] {
  const explicit = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;
  // Fallback for chapters that arrived as a single collapsed blob (e.g. EPUBs imported
  // before paragraph-break preservation): chunk by ~3 sentences so pagination has
  // break points.
  const single = explicit[0] ?? text.trim();
  const sentences = single.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 3) return [single];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    out.push(sentences.slice(i, i + 3).join(' '));
  }
  return out;
}

function splitSentences(paragraph: string): string[] {
  return paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function splitWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

type TranslationCacheEntry = { translation: string; example: string; pending?: boolean; error?: boolean };

type Token = { display: string; clean: string };
type PreparedSentence = { raw: string; tokens: Token[] };
type PreparedParagraph =
  | { kind: 'text'; sentences: PreparedSentence[] }
  | { kind: 'image'; assetId: string };

const IMG_MARKER = /^\[\[IMG:([A-Za-z0-9_-]+)\]\]$/;

function prepareContent(text: string): PreparedParagraph[] {
  return splitParagraphs(text).map((para) => {
    const trimmed = para.trim();
    const m = IMG_MARKER.exec(trimmed);
    if (m) return { kind: 'image', assetId: m[1]! };
    return {
      kind: 'text',
      sentences: splitSentences(para).map((s) => ({
        raw: s,
        tokens: splitWords(s).map((w) => ({ display: w, clean: cleanWord(w) })),
      })),
    };
  });
}

/** Whole book body — memoized so popover/karaoke/end-state changes don't walk the 5k+ word tree. */
const BookBody = memo(function BookBody({
  paragraphs,
  famMap,
  karaokeIdx,
  bookId,
}: {
  paragraphs: PreparedParagraph[];
  famMap: Record<string, Familiarity>;
  karaokeIdx: number | null;
  bookId: string;
}) {
  let idx = 0;
  return (
    <>
      {paragraphs.map((para, pi) => {
        if (para.kind === 'image') {
          return (
            <figure key={pi} data-page-block className="my-6 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/books/${bookId}/assets/${para.assetId}`}
                alt=""
                className="max-h-[70vh] w-auto max-w-full rounded"
                loading="lazy"
              />
            </figure>
          );
        }
        return (
        <p key={pi} data-page-block>
          {para.sentences.map((s, si) => (
            <span
              key={si}
              data-token="sentence"
              data-sentence={s.raw}
              className="cursor-pointer"
            >
              {s.tokens.map((tok, wi) => {
                const active = karaokeIdx === idx;
                idx += 1;
                return (
                  <span key={`${pi}-${si}-${wi}`}>
                    <MemoWord
                      display={tok.display}
                      clean={tok.clean}
                      fam={famMap[tok.clean] ?? 'Unknown'}
                      active={active}
                    />{' '}
                  </span>
                );
              })}
            </span>
          ))}
        </p>
        );
      })}
    </>
  );
});

/** Word span — memoized so only affected words re-render on state changes. */
const MemoWord = memo(function WordSpan({
  display,
  clean,
  fam,
  active,
}: {
  display: string;
  clean: string;
  fam: Familiarity;
  active: boolean;
}) {
  return (
    <span
      data-token="word"
      data-word={clean}
      data-familiarity={fam}
      data-karaoke-active={active ? 'true' : undefined}
      className="book-word"
    >
      {display}
    </span>
  );
});

export function Reader({
  chapterId,
  bookId,
  title,
  bookTitle,
  author,
  content,
  chapterIndex,
  totalChapters,
  prevChapterId,
  nextChapterId,
}: {
  chapterId: string;
  bookId: string;
  title: string;
  bookTitle: string;
  author: string | null;
  content: string;
  chapterIndex: number;
  totalChapters: number;
  prevChapterId: string | null;
  nextChapterId: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const paragraphs = useMemo(() => prepareContent(content), [content]);

  // Prefetch adjacent chapters so router.push() resolves instantly when the user
  // turns past the chapter boundary.
  useEffect(() => {
    if (prevChapterId) router.prefetch(`/read/${prevChapterId}`);
    if (nextChapterId) router.prefetch(`/read/${nextChapterId}`);
  }, [router, prevChapterId, nextChapterId]);

  // Pagination by real measurement: walk through the rendered <p> elements and pack them into
  // pages whose visible height fits the pager viewport. Computed in a layout effect after render.
  const pagerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pageOffsets, setPageOffsets] = useState<number[]>([0]);
  const [pageIdx, setPageIdx] = useState(0);

  const recomputePages = useCallback(() => {
    const pager = pagerRef.current;
    const pages = pagesRef.current;
    if (!pager || !pages) return;
    const viewportH = pager.clientHeight;
    const blocks = Array.from(pages.querySelectorAll<HTMLElement>('[data-page-block]'));
    if (blocks.length === 0 || viewportH === 0) {
      setPageOffsets([0]);
      return;
    }
    // Reset previous spacers before measuring
    for (const b of blocks) b.style.marginTop = '';

    const pagesTop = pages.getBoundingClientRect().top;
    const naturalTops = blocks.map((b) => b.getBoundingClientRect().top - pagesTop);
    const heights = blocks.map((b) => b.getBoundingClientRect().height);

    // Pack into pages aligned to viewport boundaries. For any block that doesn't fit
    // on the current page, push it down with marginTop so it lands at the next page's
    // top — guarantees no paragraph is cut visually.
    const pageStarts: number[] = [0];
    let pageStart = 0;
    let cumulativeShift = 0;
    for (let i = 0; i < blocks.length; i++) {
      const adjustedTop = naturalTops[i]! + cumulativeShift;
      const adjustedBottom = adjustedTop + heights[i]!;
      const overflow = adjustedBottom > pageStart + viewportH;
      const isFirstOnPage = adjustedTop <= pageStart;
      if (overflow && !isFirstOnPage) {
        let newPageStart = pageStart + viewportH;
        // If a previous block overflowed past the next boundary, skip ahead until we clear it.
        while (newPageStart < adjustedTop) newPageStart += viewportH;
        const spacer = newPageStart - adjustedTop;
        if (spacer > 0) {
          blocks[i]!.style.marginTop = `${spacer}px`;
          cumulativeShift += spacer;
        }
        pageStart = newPageStart;
        pageStarts.push(pageStart);
      }
    }
    setPageOffsets(pageStarts);
  }, []);

  // Recompute on content change, fonts ready, and resize
  useLayoutEffect(() => {
    recomputePages();
  }, [paragraphs, recomputePages]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    document.fonts.ready.then(() => recomputePages()).catch(() => undefined);
  }, [paragraphs, recomputePages]);

  useEffect(() => {
    const onResize = () => recomputePages();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    if (pagerRef.current) ro.observe(pagerRef.current);
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [recomputePages]);

  // Reset to first page when chapter changes
  useEffect(() => {
    setPageIdx(0);
  }, [chapterId]);

  const totalPages = pageOffsets.length;
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const translateY = pageOffsets[safePageIdx] ?? 0;

  // Flat word index map, used to render karaoke highlight without touching non-active words
  const flatTokens = useMemo(() => {
    const flat: { clean: string; display: string }[] = [];
    paragraphs.forEach((p) => {
      if (p.kind !== 'text') return;
      p.sentences.forEach((s) => s.tokens.forEach((t) => flat.push(t)));
    });
    return flat;
  }, [paragraphs]);

  // Hide app chrome for immersive reading
  useEffect(() => {
    document.body.classList.add('reader-immersive');
    return () => document.body.classList.remove('reader-immersive');
  }, []);

  // Keyboard navigation: ← previous page, → next page (jumps chapter at the extremes)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') {
        setPageIdx((n) => {
          if (n < totalPages - 1) return n + 1;
          if (nextChapterId) router.push(`/read/${nextChapterId}` as `/read/${string}`);
          return n;
        });
      } else if (e.key === 'ArrowLeft') {
        setPageIdx((n) => {
          if (n > 0) return n - 1;
          if (prevChapterId) router.push(`/read/${prevChapterId}` as `/read/${string}`);
          return n;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalPages, nextChapterId, prevChapterId, router]);

  const [famMap, setFamMap] = useState<Record<string, Familiarity>>({});
  const [addedCards, setAddedCards] = useState<Record<string, boolean>>({});
  const [ended, setEnded] = useState<{ reviewableWords: string[] } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allFailed, setAllFailed] = useState(false);
  const [invalidKey, setInvalidKey] = useState<string | null>(null);

  const [popover, setPopover] = useState<
    | { kind: 'word'; word: string; raw: string; x: number; y: number }
    | { kind: 'sentence'; sentence: string }
    | null
  >(null);

  const [karaokeIdx, setKaraokeIdx] = useState<number | null>(null);

  const isDemo = chapterId === 'demo';
  const startSession = trpc.reading.startSession.useMutation();
  const endSession = trpc.reading.endSession.useMutation();
  const translate = trpc.reading.translateWord.useMutation();
  const explain = trpc.reading.explainSentence.useMutation();
  const setFam = trpc.reading.setWordFamiliarity.useMutation();
  const addCard = trpc.reading.addWordAsFlashcard.useMutation();
  const sessionStarted = useRef(false);

  // Client-side translation cache + pending-promise dedupe
  const cacheRef = useRef<Map<string, TranslationCacheEntry>>(new Map());
  const inflightRef = useRef<Map<string, Promise<TranslationCacheEntry>>>(new Map());
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  const explainCacheRef = useRef<Map<string, { translation: string; grammar: string }>>(new Map());

  useEffect(() => {
    if (isDemo || sessionStarted.current) return;
    sessionStarted.current = true;
    startSession.mutate({ chapterId }, { onSuccess: (s) => setSessionId(s.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, isDemo]);

  const fetchTranslation = useCallback(
    async (word: string, context: string): Promise<TranslationCacheEntry> => {
      const key = word.toLowerCase();
      const cached = cacheRef.current.get(key);
      if (cached && !cached.pending) return cached;
      const existing = inflightRef.current.get(key);
      if (existing) return existing;

      cacheRef.current.set(key, { translation: '', example: '', pending: true });
      bump();
      const p = (async () => {
        try {
          const res = await translate.mutateAsync({ word, context });
          const isFallback = (res as { fallback?: boolean }).fallback === true;
          const entry: TranslationCacheEntry = isFallback
            ? { translation: '', example: '', error: true }
            : { translation: res.translation, example: res.example };
          cacheRef.current.set(key, entry);
          return entry;
        } catch (err) {
          cacheRef.current.set(key, { translation: '', example: '', error: true });
          const msg = String((err as Error).message ?? err);
          if (/all\s*providers/i.test(msg) || /AllProvidersFailed/i.test(msg)) setAllFailed(true);
          else if (/401|authentication/i.test(msg)) setInvalidKey('claude');
          throw err;
        } finally {
          inflightRef.current.delete(key);
          bump();
        }
      })();
      inflightRef.current.set(key, p);
      return p;
    },
    [translate, bump],
  );

  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefetchRef = useRef<{ clean: string; raw: string } | null>(null);

  const prefetchDebounced = useCallback(
    (clean: string, raw: string) => {
      if (!clean) return;
      if (cacheRef.current.has(clean) || inflightRef.current.has(clean)) return;
      pendingPrefetchRef.current = { clean, raw };
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = setTimeout(() => {
        const target = pendingPrefetchRef.current;
        pendingPrefetchRef.current = null;
        if (!target) return;
        if (cacheRef.current.has(target.clean) || inflightRef.current.has(target.clean)) return;
        fetchTranslation(target.clean, target.raw).catch(() => undefined);
      }, 180);
    },
    [fetchTranslation],
  );

  useEffect(() => {
    return () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    };
  }, []);

  async function handleSentenceClick(s: string) {
    setPopover({ kind: 'sentence', sentence: s });
    const cached = explainCacheRef.current.get(s);
    if (cached) return;
    try {
      const res = await explain.mutateAsync({ sentence: s });
      explainCacheRef.current.set(s, {
        translation: res.translation,
        grammar: String(res.grammar ?? 'N/A'),
      });
      bump();
    } catch {
      // ignore
    }
  }

  async function advanceFamiliarity(word: string) {
    const order: Familiarity[] = ['Unknown', 'New', 'Learning', 'Known'];
    const curr = famMap[word] ?? 'Unknown';
    const next = order[Math.min(order.indexOf(curr) + 1, order.length - 1)]!;
    setFamMap((m) => ({ ...m, [word]: next }));
    await setFam.mutateAsync({ word, familiarity: next });
  }

  async function doAddCard(word: string, context: string) {
    await addCard.mutateAsync({ word, context });
    setAddedCards((m) => ({ ...m, [word]: true }));
    setFamMap((m) => ({ ...m, [word]: 'Learning' }));
  }

  function playKaraoke() {
    let i = 0;
    setKaraokeIdx(0);
    // Server caps TTS text at 3000 chars; chunk locally to stay within the cap.
    const ttsText = content.slice(0, 3000);
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(ttsText)}`);
    audio.play().catch(() => undefined);
    const interval = setInterval(() => {
      i += 1;
      if (i >= flatTokens.length) {
        clearInterval(interval);
        setKaraokeIdx(null);
        return;
      }
      setKaraokeIdx(i);
    }, 350);
  }

  async function doEndSession() {
    if (!sessionId) {
      setEnded({ reviewableWords: Object.keys(famMap).filter((w) => famMap[w] === 'Learning') });
      return;
    }
    const res = await endSession.mutateAsync({ sessionId });
    setEnded({ reviewableWords: res.reviewableWords });
  }

  const onArticleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const wordEl = target.closest('[data-token="word"]') as HTMLElement | null;
      if (wordEl) {
        const rect = wordEl.getBoundingClientRect();
        const clean = wordEl.dataset.word ?? '';
        const raw = wordEl.textContent ?? '';
        if (!clean) return;
        setPopover({ kind: 'word', word: clean, raw, x: rect.left + rect.width / 2, y: rect.top });
        setAllFailed(false);
        fetchTranslation(clean, raw).catch(() => undefined);
        return;
      }
      let sentenceEl = target.closest('[data-token="sentence"]') as HTMLElement | null;
      // When the click lands on the paragraph background (e.g. between lines, where
      // multi-line inline sentence spans don't paint), probe the paragraph's sentence
      // children using their per-line client rects.
      if (!sentenceEl && target.tagName === 'P') {
        const px = e.clientX;
        const py = e.clientY;
        const sentences = target.querySelectorAll<HTMLElement>('[data-token="sentence"]');
        for (const s of sentences) {
          for (const r of Array.from(s.getClientRects())) {
            if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
              sentenceEl = s;
              break;
            }
          }
          if (sentenceEl) break;
        }
        // Fallback: pick the sentence whose vertical band contains the click.
        if (!sentenceEl && sentences.length > 0) {
          for (const s of sentences) {
            const r = s.getBoundingClientRect();
            if (py >= r.top && py <= r.bottom) {
              sentenceEl = s;
              break;
            }
          }
        }
      }
      if (sentenceEl?.dataset.sentence) {
        handleSentenceClick(sentenceEl.dataset.sentence);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTranslation],
  );

  const onArticleMouseOver = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const wordEl = target.closest('[data-token="word"]') as HTMLElement | null;
      if (!wordEl) return;
      const clean = wordEl.dataset.word ?? '';
      const raw = wordEl.textContent ?? '';
      if (clean) prefetchDebounced(clean, raw);
    },
    [prefetchDebounced],
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[color:var(--paper,#f7efdf)]">
      {/* Immersive bar */}
      <div className="sticky top-0 z-10 border-b border-[color:var(--paper-border,#e6dcc6)] bg-[color:var(--paper,#f7efdf)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/library"
            aria-label="Back to library"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-muted,#6b5f4a)] transition hover:text-[color:var(--ink,#2a2218)]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </Link>
          <div className="min-w-0 text-center text-xs text-[color:var(--ink-muted,#6b5f4a)]">
            <p className="truncate font-medium uppercase tracking-[0.16em]">{bookTitle}</p>
            <p className="mt-0.5 tabular-nums">
              {chapterIndex + 1} / {totalChapters}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playKaraoke}
              aria-label={t('reading.play')}
              className="rounded-full border border-[color:var(--paper-border,#e6dcc6)] bg-white/60 p-2 text-[color:var(--ink,#2a2218)] transition hover:bg-white"
            >
              <Play size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Book column — clipped pager, content translated by pageOffsets[pageIdx] */}
      <div ref={pagerRef} className="relative flex-1 overflow-hidden">
        <div
          ref={pagesRef}
          className="mx-auto w-full max-w-[680px] px-6 py-12 sm:px-10 sm:py-16"
          style={{
            transform: `translate3d(0, -${translateY}px, 0)`,
            transition: 'transform 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          <header data-page-block className="mb-14 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted,#6b5f4a)]">
              {`Chapter ${chapterIndex + 1}`}
            </p>
            <h1 className="book-title mt-4 text-4xl font-semibold leading-tight tracking-tight text-[color:var(--ink,#2a2218)] sm:text-5xl">
              {title}
            </h1>
            {author && (
              <p className="book-title mt-4 text-base italic text-[color:var(--ink-muted,#6b5f4a)]">
                {author}
              </p>
            )}
            <span className="mx-auto mt-8 block h-px w-16 bg-[color:var(--paper-border,#cfc3a6)]" />
          </header>

          <article
            className="book-prose"
            onClick={onArticleClick}
            onMouseOver={onArticleMouseOver}
          >
            <BookBody paragraphs={paragraphs} famMap={famMap} karaokeIdx={karaokeIdx} bookId={bookId} />
          </article>
        </div>
      </div>

      {/* Side arrows — fixed, vertically centered, outside the clipped pager */}
      <SideArrow
        side="left"
        disabled={pageIdx === 0 && !prevChapterId}
        onClick={() => {
          if (pageIdx > 0) setPageIdx((n) => n - 1);
          else if (prevChapterId) router.push(`/read/${prevChapterId}` as `/read/${string}`);
        }}
        label={pageIdx > 0 ? 'Previous page' : 'Previous chapter'}
      />
      <SideArrow
        side="right"
        disabled={pageIdx >= totalPages - 1 && !nextChapterId}
        onClick={() => {
          if (pageIdx < totalPages - 1) setPageIdx((n) => n + 1);
          else if (nextChapterId) router.push(`/read/${nextChapterId}` as `/read/${string}`);
        }}
        label={pageIdx < totalPages - 1 ? 'Next page' : 'Next chapter'}
      />

      {/* Bottom bar: page indicator + dots + end session */}
      <div className="border-t border-[color:var(--paper-border,#e6dcc6)] bg-[color:var(--paper,#f7efdf)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--ink-muted,#6b5f4a)] tabular-nums">
            Page {safePageIdx + 1} / {totalPages}
          </span>
          {totalPages > 1 && totalPages <= 30 && (
            <span className="flex flex-1 justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to page ${i + 1}`}
                  onClick={() => setPageIdx(i)}
                  className="h-1.5 w-1.5 rounded-full transition"
                  style={{
                    background:
                      i === safePageIdx
                        ? 'var(--ink, #2a2218)'
                        : 'var(--paper-border, #cfc3a6)',
                  }}
                />
              ))}
            </span>
          )}
          <button
            type="button"
            onClick={doEndSession}
            className="rounded-full bg-[color:var(--ink,#2a2218)] px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            {t('reading.endSession')}
          </button>
        </div>
      </div>

      {/* Word tooltip */}
      {popover?.kind === 'word' && (
        <WordTooltip
          x={popover.x}
          y={popover.y}
          word={popover.word}
          entry={cacheRef.current.get(popover.word)}
          added={!!addedCards[popover.word]}
          onAdvance={() => advanceFamiliarity(popover.word)}
          onAdd={() =>
            doAddCard(popover.word, cacheRef.current.get(popover.word)?.example ?? popover.raw)
          }
          onClose={() => setPopover(null)}
          closeLabel={t('common.close')}
          addLabel={t('reading.addFlashcard')}
          advanceLabel={t('reading.advance')}
        />
      )}

      {/* Sentence modal */}
      {popover?.kind === 'sentence' && (
        <div
          data-testid="sentence-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPopover(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-xs uppercase tracking-[0.16em] text-fg-muted">
              {t('reading.sentence')}
            </h3>
            <p className="serif mb-4 italic">{popover.sentence}</p>
            <div className="mb-1 text-xs uppercase tracking-[0.14em] text-fg-muted">
              {t('reading.translation')}
            </div>
            <div data-testid="sentence-translation" className="mb-4 text-fg">
              {explain.isPending && !explainCacheRef.current.get(popover.sentence)
                ? '…'
                : explainCacheRef.current.get(popover.sentence)?.translation ?? ''}
            </div>
            <div className="mb-1 text-xs uppercase tracking-[0.14em] text-fg-muted">
              {t('reading.grammar')}
            </div>
            <div data-testid="sentence-grammar" className="text-fg">
              {explain.isPending && !explainCacheRef.current.get(popover.sentence)
                ? '…'
                : explainCacheRef.current.get(popover.sentence)?.grammar ?? ''}
            </div>
            <button
              type="button"
              onClick={() => setPopover(null)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm transition hover:bg-surface-muted"
            >
              <X size={14} />
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {ended && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-5 shadow-[0_-10px_30px_-10px_rgba(20,15,10,0.2)]">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {t('reading.sessionEnded')} <strong>{ended.reviewableWords.length}</strong>{' '}
              {t('reading.wordsLearned')}
            </p>
            <button
              type="button"
              onClick={() => (window.location.href = '/review')}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              {t('reading.reviewWords')}
            </button>
          </div>
        </div>
      )}

      {allFailed && (
        <div
          data-testid="llm-all-failed"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-900 shadow"
        >
          {t('reading.allFailed')}
        </div>
      )}
      {invalidKey === 'claude' && (
        <div
          data-testid="invalid-key-warning-claude"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-900 shadow"
        >
          {t('reading.invalidKey')}
        </div>
      )}
    </div>
  );
}

function WordTooltip({
  x,
  y,
  word,
  entry,
  added,
  onAdvance,
  onAdd,
  onClose,
  closeLabel,
  addLabel,
  advanceLabel,
}: {
  x: number;
  y: number;
  word: string;
  entry?: TranslationCacheEntry;
  added: boolean;
  onAdvance: () => void;
  onAdd: () => void;
  onClose: () => void;
  closeLabel: string;
  addLabel: string;
  advanceLabel: string;
}) {
  // Anchor popover above the clicked word; clamp to viewport
  const width = 280;
  const left = Math.max(12, Math.min(x - width / 2, window.innerWidth - width - 12));
  const above = y > 200;
  const top = above ? y - 12 : y + 28;
  const pending = entry?.pending || !entry;

  return (
    <div
      data-testid="word-tooltip"
      role="dialog"
      className="fixed z-50 w-[280px] rounded-xl border border-border bg-surface p-4 shadow-[0_14px_40px_-12px_rgba(20,15,10,0.25)]"
      style={{
        left,
        top,
        transform: above ? 'translateY(-100%)' : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="serif text-lg font-semibold">{word}</p>
          <p
            data-testid="word-tooltip-translation"
            className="mt-1 text-sm text-fg"
          >
            {pending ? (
              <span className="inline-block h-4 w-24 animate-pulse rounded bg-surface-muted" />
            ) : entry?.error ? (
              <span className="text-fg-muted">Tradução indisponível. Verifique sua chave de API.</span>
            ) : (
              entry?.translation || '—'
            )}
          </p>
          {entry?.example && !pending && (
            <p className="mt-2 text-xs italic text-fg-muted">{entry.example}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="shrink-0 rounded-full p-1 text-fg-muted hover:bg-surface-muted"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={added}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
        >
          {added ? <Check size={12} /> : <Plus size={12} />}
          {addLabel}
        </button>
        <button
          type="button"
          data-testid="familiarity-advance"
          onClick={onAdvance}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
        >
          {advanceLabel}
        </button>
      </div>
    </div>
  );
}

function SideArrow({
  side,
  disabled,
  onClick,
  label,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`fixed top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--paper-border,#e6dcc6)] bg-white/70 text-[color:var(--ink-muted,#6b5f4a)] backdrop-blur transition hover:bg-white hover:text-[color:var(--ink,#2a2218)] hover:shadow-[0_8px_30px_-12px_rgba(20,15,10,0.25)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/70 sm:flex h-12 w-12 ${
        side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
      }`}
    >
      {side === 'left' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

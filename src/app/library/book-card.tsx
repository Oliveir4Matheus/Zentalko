'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, List, X } from 'lucide-react';
import { DeleteBookButton } from './delete-button';
import { deleteBookAction } from '@/app/actions/library';

interface Chapter {
  id: string;
  index: number;
  title: string;
  percent: number;
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string | null;
  chapters: Chapter[];
  bookPercent: number;
  lastChapterId: string | null;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function BookCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const continueHref = book.lastChapterId
    ? (`/read/${book.lastChapterId}` as `/read/${string}`)
    : null;

  return (
    <>
      <div className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-3 transition hover:shadow-[0_6px_20px_-12px_rgba(20,15,10,0.25)]">
        {continueHref ? (
          <Link
            href={continueHref}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <CardLeft />
            <CardBody book={book} />
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-4 text-left">
            <CardLeft />
            <CardBody book={book} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ver capítulos"
          title="Ver capítulos"
          className="shrink-0 rounded-full border border-border p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
        >
          <List size={16} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
              <div className="min-w-0">
                <h2 className="serif truncate text-lg font-semibold">{book.title}</h2>
                {book.author && (
                  <p className="truncate text-xs text-fg-muted">{book.author}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full bg-accent"
                      style={{ width: `${book.bookPercent * 100}%` }}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-fg-muted">
                    {pct(book.bookPercent)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <form action={deleteBookAction}>
                  <input type="hidden" name="bookId" value={book.id} />
                  <DeleteBookButton title={book.title} />
                </form>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-fg-muted hover:bg-surface-muted"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {book.chapters.length === 0 ? (
              <p className="p-6 text-center text-sm text-fg-muted">Sem capítulos.</p>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
                {book.chapters.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/read/${c.id}` as `/read/${string}`}
                      onClick={() => setOpen(false)}
                      data-testid="chapter-item"
                      className="flex items-center gap-3 px-5 py-2 text-sm transition hover:bg-surface-muted"
                    >
                      <span className="serif w-8 tabular-nums text-fg-muted">
                        {String(c.index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="w-10 text-right text-[11px] tabular-nums text-fg-muted">
                        {pct(c.percent)}
                      </span>
                      <ChevronRight size={14} className="text-fg-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CardLeft() {
  return (
    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
      <BookOpen size={18} className="text-accent" />
    </div>
  );
}

function CardBody({ book }: { book: Book }) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="serif truncate text-base font-semibold">{book.title}</h3>
      {book.author && <p className="truncate text-xs text-fg-muted">{book.author}</p>}
      <p className="mt-0.5 text-xs text-fg-muted">
        {book.chapters.length} {book.chapters.length === 1 ? 'capítulo' : 'capítulos'}
        {book.language ? ` · ${book.language.toUpperCase()}` : ''}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <span
            className="block h-full bg-accent transition-[width]"
            style={{ width: `${book.bookPercent * 100}%` }}
          />
        </span>
        <span className="w-10 text-right text-[11px] tabular-nums text-fg-muted">
          {pct(book.bookPercent)}
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { DeleteBookButton } from './delete-button';
import { deleteBookAction } from '@/app/actions/library';

interface Chapter {
  id: string;
  index: number;
  title: string;
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string | null;
  chapters: Chapter[];
}

export function BookCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-3 text-left transition hover:shadow-[0_6px_20px_-12px_rgba(20,15,10,0.25)]"
      >
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <BookOpen size={18} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="serif truncate text-base font-semibold">{book.title}</h3>
          {book.author && (
            <p className="truncate text-xs text-fg-muted">{book.author}</p>
          )}
          <p className="mt-0.5 text-xs text-fg-muted">
            {book.chapters.length} {book.chapters.length === 1 ? 'capítulo' : 'capítulos'}
            {book.language ? ` · ${book.language.toUpperCase()}` : ''}
          </p>
        </div>
        <ChevronRight size={16} className="text-fg-muted transition group-hover:translate-x-0.5" />
      </button>

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

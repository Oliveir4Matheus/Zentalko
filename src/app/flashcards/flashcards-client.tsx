'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/context';

type Card = {
  id: string;
  front: string;
  back: string;
  direction: 'EN_TO_PT' | 'PT_TO_EN' | 'BOTH';
  state: string;
  dueAt: string | Date;
  reps: number;
  tags: string[];
};

export function FlashcardsClient() {
  const t = useT();
  const utils = trpc.useUtils();
  const listQ = trpc.flashcards.list.useQuery();

  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [creating, setCreating] = useState(false);

  const create = trpc.flashcards.create.useMutation({
    onSuccess: () => {
      setNewFront('');
      setNewBack('');
      setCreating(false);
      utils.flashcards.list.invalidate();
    },
  });

  const update = trpc.flashcards.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      utils.flashcards.list.invalidate();
    },
  });

  const remove = trpc.flashcards.delete.useMutation({
    onSuccess: () => utils.flashcards.list.invalidate(),
  });

  const filtered = useMemo(() => {
    const cards = (listQ.data ?? []) as unknown as Card[];
    if (!query.trim()) return cards;
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [listQ.data, query]);

  function startEdit(c: Card) {
    setEditingId(c.id);
    setEditFront(c.front);
    setEditBack(c.back);
  }

  async function saveEdit() {
    if (!editingId) return;
    await update.mutateAsync({ cardId: editingId, front: editFront, back: editBack });
  }

  async function saveNew() {
    if (!newFront.trim() || !newBack.trim()) return;
    await create.mutateAsync({
      front: newFront.trim(),
      back: newBack.trim(),
      direction: 'EN_TO_PT',
    });
  }

  return (
    <main className="mx-auto mt-6 max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t('flashcards.title')}</h1>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="rounded bg-sky-600 px-3 py-2 text-sm text-white"
        >
          + {t('flashcards.new') || 'Novo cartão'}
        </button>
      </header>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('flashcards.search') || 'Buscar…'}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {creating && (
        <section className="mb-4 rounded border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold">{t('flashcards.new') || 'Novo cartão'}</h3>
          <div className="space-y-2">
            <input
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Frente (inglês)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Verso (português)"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveNew}
                disabled={create.isPending}
                className="rounded bg-sky-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {t('settings.save')}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded bg-slate-200 px-3 py-2 text-sm dark:bg-slate-700"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </section>
      )}

      {listQ.isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('review.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('flashcards.empty') || 'Nenhum cartão ainda.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const isEditing = editingId === c.id;
            const due = new Date(c.dueAt);
            return (
              <li
                key={c.id}
                className="rounded border border-slate-200 p-3 dark:border-slate-800"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded bg-sky-600 px-2 py-1 text-xs text-white"
                      >
                        {t('settings.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.front}</div>
                      <div className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {c.back}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>{c.state}</span>
                        <span>· reps: {c.reps}</span>
                        <span>· {due.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700"
                      >
                        {t('settings.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t('settings.confirmDelete'))) {
                            remove.mutate({ cardId: c.id });
                          }
                        }}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-950 dark:text-red-200"
                      >
                        {t('settings.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/context';

type Rating = 'Again' | 'Hard' | 'Good' | 'Easy';

export function ReviewClient({ mode }: { mode: 'default' | 'typing' }) {
  const t = useT();
  const utils = trpc.useUtils();
  const queueQ = trpc.flashcards.dueQueue.useQuery();
  const me = trpc.stats.me.useQuery();
  const review = trpc.flashcards.review.useMutation({
    onSuccess: () => {
      utils.flashcards.dueQueue.invalidate();
      // Reset to top of freshly invalidated queue: the reviewed card is gone.
      setIndex(0);
      setRevealed(false);
      setTyped('');
      setTypingFeedback(null);
    },
  });

  const [index, setIndex] = useState<number>(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<null | boolean>(null);
  const [showNew, setShowNew] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const createCard = trpc.flashcards.create.useMutation({
    onSuccess: () => {
      utils.flashcards.dueQueue.invalidate();
      setShowNew(false);
      setNewFront('');
      setNewBack('');
      setIndex(0);
    },
  });

  async function saveNew() {
    if (!newFront.trim() || !newBack.trim()) return;
    await createCard.mutateAsync({
      front: newFront.trim(),
      back: newBack.trim(),
      direction: 'EN_TO_PT',
    });
  }

  const cards = queueQ.data ?? [];
  const card = cards[index];

  if (queueQ.isLoading) return <main className="p-6">{t('review.loading')}</main>;

  const newCardPanel = showNew && (
    <div className="mb-4 rounded border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold">Novo cartão</h3>
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
            disabled={createCard.isPending}
            className="rounded bg-sky-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('settings.save')}
          </button>
          <button
            type="button"
            onClick={() => setShowNew(false)}
            className="rounded bg-slate-200 px-3 py-2 text-sm dark:bg-slate-700"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );

  if (!card) {
    return (
      <main className="mx-auto mt-10 max-w-xl p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
          >
            + Novo cartão
          </button>
        </div>
        {newCardPanel}
        <p className="rounded bg-emerald-100 p-4 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          {t('review.dailyGoalReached')}
        </p>
      </main>
    );
  }

  function rate(r: Rating) {
    if (!card) return;
    review.mutate({ cardId: card.id, rating: r });
  }

  function playAudio() {
    if (!card) return;
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(card.front)}`);
    audio.play().catch(() => undefined);
  }

  return (
    <main className="mx-auto mt-10 max-w-xl p-6">
      <header className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          {index + 1} / {cards.length}
        </span>
        <div className="flex items-center gap-3">
          <span>XP: {me.data?.xp ?? 0}</span>
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="rounded bg-sky-600 px-2 py-1 text-xs text-white"
          >
            + Novo cartão
          </button>
        </div>
      </header>
      {newCardPanel}

      <div className="rounded border border-slate-200 p-8 text-center dark:border-slate-800">
        <div data-testid="card-front" className="text-3xl font-semibold">
          {card.front}
        </div>
        {mode === 'typing' && (
          <div className="mt-6">
            <span
              data-testid="expected-answer"
              data-answer={card.back}
              className="sr-only"
            />
            <input
              data-testid="typing-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const ok = typed.trim().toLowerCase() === card.back.trim().toLowerCase();
                  setTypingFeedback(ok);
                  if (ok) rate('Good');
                }
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder={t('review.typingPlaceholder')}
            />
            <div
              data-testid="typing-feedback"
              data-correct={typingFeedback === true ? 'true' : 'false'}
              className="mt-2 text-sm"
            >
              {typingFeedback === true && t('review.typingCorrect')}
              {typingFeedback === false && t('review.typingWrong')}
            </div>
          </div>
        )}
        {mode === 'default' && revealed && (
          <div className="mt-6 text-xl text-slate-600 dark:text-slate-300">{card.back}</div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={playAudio}
          className="rounded bg-slate-200 px-3 py-2 text-sm hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {t('review.play')}
        </button>
        {mode === 'default' && !revealed && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="ml-auto rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            {t('review.showAnswer')}
          </button>
        )}
      </div>

      {mode === 'default' && revealed && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <RateBtn label={t('review.again')} onClick={() => rate('Again')} color="bg-red-600" />
          <RateBtn label={t('review.hard')} onClick={() => rate('Hard')} color="bg-orange-500" />
          <RateBtn label={t('review.good')} onClick={() => rate('Good')} color="bg-emerald-600" />
          <RateBtn label={t('review.easy')} onClick={() => rate('Easy')} color="bg-sky-600" />
        </div>
      )}
    </main>
  );
}

function RateBtn({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${color} rounded px-3 py-2 text-white`}
    >
      {label}
    </button>
  );
}

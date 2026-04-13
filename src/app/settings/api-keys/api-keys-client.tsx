'use client';

import { useState, useTransition } from 'react';
import {
  upsertApiKeyAction,
  deleteApiKeyAction,
  reorderProvidersAction,
} from '@/app/actions/settings';
import { useT } from '@/lib/i18n/context';

type LlmProvider = 'claude' | 'openai' | 'gemini' | 'openrouter';
type Row = { provider: LlmProvider; maskedKey: string; priority: number };

const PROVIDERS: LlmProvider[] = ['claude', 'openai', 'gemini', 'openrouter'];
const LABELS: Record<LlmProvider, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini (Google)',
  openrouter: 'OpenRouter',
};

function maskClient(plaintext: string): string {
  if (plaintext.length <= 8) return '****';
  return `${plaintext.slice(0, 4)}****${plaintext.slice(-4)}`;
}

export function ApiKeysClient({ initialKeys }: { initialKeys: Row[] }) {
  const t = useT();
  const [keys, setKeys] = useState<Row[]>(initialKeys);
  const [inputs, setInputs] = useState<Record<LlmProvider, string>>({
    claude: '',
    openai: '',
    gemini: '',
    openrouter: '',
  });
  const [confirmingDelete, setConfirmingDelete] = useState<LlmProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [dragFrom, setDragFrom] = useState<LlmProvider | null>(null);

  function orderedProviders(): LlmProvider[] {
    const saved = [...keys].sort((a, b) => a.priority - b.priority).map((k) => k.provider);
    const unsaved = PROVIDERS.filter((p) => !saved.includes(p));
    return [...saved, ...unsaved];
  }

  async function save(provider: LlmProvider) {
    const value = inputs[provider];
    if (!value.trim()) return;
    const fd = new FormData();
    fd.set('provider', provider);
    fd.set('key', value);
    const res = await upsertApiKeyAction(fd);
    const mask = maskClient(value);
    setKeys((prev) => {
      const other = prev.filter((k) => k.provider !== provider);
      const priority = prev.find((k) => k.provider === provider)?.priority ?? prev.length;
      return [...other, { provider, maskedKey: mask, priority }];
    });
    setInputs((n) => ({ ...n, [provider]: '' }));
    setMessage(res.updated ? t('settings.updated') : t('settings.saved'));
  }

  async function remove(provider: LlmProvider) {
    const fd = new FormData();
    fd.set('provider', provider);
    await deleteApiKeyAction(fd);
    setKeys((prev) => prev.filter((k) => k.provider !== provider));
    setConfirmingDelete(null);
  }

  function onDragStart(p: LlmProvider) {
    setDragFrom(p);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(target: LlmProvider) {
    if (!dragFrom || dragFrom === target) return;
    const current = orderedProviders();
    const fromIdx = current.indexOf(dragFrom);
    const toIdx = current.indexOf(target);
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved!);
    setKeys((prev) =>
      prev.map((k) => ({ ...k, priority: current.indexOf(k.provider) })),
    );
    setDragFrom(null);
    startTransition(async () => {
      await reorderProvidersAction(current.filter((p) => keys.some((k) => k.provider === p)));
    });
  }

  return (
    <main className="mx-auto mt-10 max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('settings.apiKeysTitle')}</h1>

      {message && (
        <p className="mb-4 rounded bg-emerald-100 p-2 text-sm text-emerald-900">{message}</p>
      )}

      <div className="space-y-3">
        {orderedProviders().map((p) => {
          const row = keys.find((k) => k.provider === p);
          return (
            <div
              key={p}
              data-testid="provider-row"
              data-provider={p}
              draggable={Boolean(row)}
              onDragStart={() => onDragStart(p)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(p)}
              className="rounded border border-slate-200 p-4 dark:border-slate-800"
            >
              <label className="mb-2 flex items-center justify-between">
                <span className="font-medium">{LABELS[p]}</span>
                {row && (
                  <span
                    data-testid={`key-${p}-masked`}
                    className="font-mono text-sm text-slate-500"
                  >
                    {row.maskedKey}
                  </span>
                )}
                <input
                  aria-label={LABELS[p]}
                  type="text"
                  value={inputs[p]}
                  onChange={(e) => setInputs((n) => ({ ...n, [p]: e.target.value }))}
                  placeholder={row ? t('settings.keysReplacePlaceholder') : t('settings.keysPlaceholder')}
                  className="ml-3 flex-1 rounded border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900"
                />
              </label>

              <div className="flex gap-2">
                {inputs[p].trim() && (
                  <button
                    type="button"
                    onClick={() => save(p)}
                    className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
                  >
                    {t('settings.save')}
                  </button>
                )}
                {row && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setInputs((n) => ({ ...n, [p]: '' }));
                      }}
                      className="rounded bg-slate-200 px-3 py-1 text-sm dark:bg-slate-700"
                    >
                      {t('settings.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(p)}
                      className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
                    >
                      {t('settings.delete')}
                    </button>
                  </>
                )}
              </div>

              {confirmingDelete === p && (
                <div className="mt-3 rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <p className="mb-2">{t('settings.confirmDelete')}</p>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    className="mr-2 rounded bg-red-600 px-3 py-1 text-white"
                  >
                    {t('settings.confirm')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(null)}
                    className="rounded bg-slate-200 px-3 py-1 dark:bg-slate-700"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

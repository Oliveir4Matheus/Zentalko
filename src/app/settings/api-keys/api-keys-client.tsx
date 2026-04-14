'use client';

import { useState, useTransition } from 'react';
import {
  upsertApiKeyAction,
  deleteApiKeyAction,
  updateApiKeyModelAction,
  setDefaultProviderAction,
  testApiKeyAction,
} from '@/app/actions/settings';
import { useT } from '@/lib/i18n/context';

type LlmProvider = 'claude' | 'openai' | 'gemini' | 'openrouter';
type Row = {
  provider: LlmProvider;
  maskedKey: string;
  model: string | null;
  priority: number;
};

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

type TestResult = { ok: boolean; reply?: string; error?: string };

export function ApiKeysClient({
  initialKeys,
  availableModels,
}: {
  initialKeys: Row[];
  availableModels: Record<LlmProvider, string[]>;
}) {
  const t = useT();
  const [keys, setKeys] = useState<Row[]>(initialKeys);
  const [inputs, setInputs] = useState<Record<LlmProvider, string>>({
    claude: '',
    openai: '',
    gemini: '',
    openrouter: '',
  });
  const [modelDrafts, setModelDrafts] = useState<Record<LlmProvider, string>>({
    claude: '',
    openai: '',
    gemini: '',
    openrouter: '',
  });
  const [confirmingDelete, setConfirmingDelete] = useState<LlmProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<LlmProvider, TestResult>>>({});
  const [testing, setTesting] = useState<LlmProvider | null>(null);
  const [, startTransition] = useTransition();

  const defaultProvider = [...keys].sort((a, b) => a.priority - b.priority)[0]?.provider ?? null;

  function modelOf(p: LlmProvider): string {
    return modelDrafts[p] || keys.find((k) => k.provider === p)?.model || '';
  }

  async function save(provider: LlmProvider) {
    const value = inputs[provider];
    const model = modelDrafts[provider].trim();
    if (!value.trim()) return;
    const fd = new FormData();
    fd.set('provider', provider);
    fd.set('key', value);
    if (model) fd.set('model', model);
    const res = await upsertApiKeyAction(fd);
    const mask = maskClient(value);
    setKeys((prev) => {
      const other = prev.filter((k) => k.provider !== provider);
      const priority = prev.find((k) => k.provider === provider)?.priority ?? prev.length;
      return [
        ...other,
        { provider, maskedKey: mask, model: model || null, priority },
      ];
    });
    setInputs((n) => ({ ...n, [provider]: '' }));
    setModelDrafts((n) => ({ ...n, [provider]: '' }));
    setMessage(res.updated ? t('settings.updated') : t('settings.saved'));
  }

  async function saveModelOnly(provider: LlmProvider) {
    const model = modelDrafts[provider].trim() || null;
    await updateApiKeyModelAction(provider, model);
    setKeys((prev) =>
      prev.map((k) => (k.provider === provider ? { ...k, model } : k)),
    );
    setModelDrafts((n) => ({ ...n, [provider]: '' }));
    setMessage(t('settings.updated'));
  }

  async function remove(provider: LlmProvider) {
    const fd = new FormData();
    fd.set('provider', provider);
    await deleteApiKeyAction(fd);
    setKeys((prev) => prev.filter((k) => k.provider !== provider));
    setConfirmingDelete(null);
  }

  async function runTest(provider: LlmProvider) {
    setTesting(provider);
    setTestResults((r) => ({ ...r, [provider]: undefined }));
    try {
      const fd = new FormData();
      fd.set('provider', provider);
      const typedKey = inputs[provider].trim();
      if (typedKey) fd.set('key', typedKey);
      const m = modelDrafts[provider].trim();
      if (m) fd.set('model', m);
      const res = (await testApiKeyAction(fd)) as TestResult;
      setTestResults((r) => ({ ...r, [provider]: res }));
    } catch (err) {
      setTestResults((r) => ({
        ...r,
        [provider]: { ok: false, error: (err as Error).message },
      }));
    } finally {
      setTesting(null);
    }
  }

  function makeDefault(provider: LlmProvider) {
    setKeys((prev) => {
      const others = prev.filter((k) => k.provider !== provider);
      const target = prev.find((k) => k.provider === provider);
      if (!target) return prev;
      return [
        { ...target, priority: 0 },
        ...others.map((k, i) => ({ ...k, priority: i + 1 })),
      ];
    });
    startTransition(async () => {
      await setDefaultProviderAction(provider);
    });
  }

  const ordered = (() => {
    const saved = [...keys].sort((a, b) => a.priority - b.priority).map((k) => k.provider);
    const unsaved = PROVIDERS.filter((p) => !saved.includes(p));
    return [...saved, ...unsaved];
  })();

  return (
    <main className="mx-auto mt-10 max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('settings.apiKeysTitle')}</h1>

      {message && (
        <p className="mb-4 rounded bg-emerald-100 p-2 text-sm text-emerald-900">{message}</p>
      )}

      <div className="space-y-3">
        {ordered.map((p) => {
          const row = keys.find((k) => k.provider === p);
          const isDefault = defaultProvider === p;
          const models = availableModels[p] ?? [];
          const currentModel = modelOf(p);
          const test = testResults[p];
          return (
            <div
              key={p}
              data-testid="provider-row"
              data-provider={p}
              className="rounded border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{LABELS[p]}</span>
                  {isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {t('settings.defaultProvider') || 'Padrão'}
                    </span>
                  )}
                </div>
                {row && (
                  <span
                    data-testid={`key-${p}-masked`}
                    className="font-mono text-sm text-slate-500"
                  >
                    {row.maskedKey}
                  </span>
                )}
              </div>

              <input
                aria-label={LABELS[p]}
                type="text"
                value={inputs[p]}
                onChange={(e) => setInputs((n) => ({ ...n, [p]: e.target.value }))}
                placeholder={row ? t('settings.keysReplacePlaceholder') : t('settings.keysPlaceholder')}
                className="mb-2 w-full rounded border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900"
              />

              <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-slate-500">
                  {t('settings.model') || 'Modelo'}
                </label>
                <select
                  value={currentModel}
                  onChange={(e) => setModelDrafts((n) => ({ ...n, [p]: e.target.value }))}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:bg-slate-900"
                >
                  <option value="">{t('settings.modelDefault') || '(padrão)'}</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {row && modelDrafts[p] && modelDrafts[p] !== (row.model ?? '') && (
                  <button
                    type="button"
                    onClick={() => saveModelOnly(p)}
                    className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700"
                  >
                    {t('settings.save')}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {inputs[p].trim() && (
                  <button
                    type="button"
                    onClick={() => save(p)}
                    className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
                  >
                    {t('settings.save')}
                  </button>
                )}
                {(row || inputs[p].trim()) && (
                  <button
                    type="button"
                    disabled={testing === p}
                    onClick={() => runTest(p)}
                    className="rounded bg-slate-200 px-3 py-1 text-sm disabled:opacity-60 dark:bg-slate-700"
                  >
                    {testing === p
                      ? (t('settings.testing') || 'Testando…')
                      : (t('settings.test') || 'Testar')}
                  </button>
                )}
                {row && !isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(p)}
                    className="rounded bg-emerald-100 px-3 py-1 text-sm text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                  >
                    {t('settings.setDefault') || 'Definir como padrão'}
                  </button>
                )}
                {row && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(p)}
                    className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
                  >
                    {t('settings.delete')}
                  </button>
                )}
              </div>

              {test && (
                <p
                  data-testid={`test-result-${p}`}
                  className={`mt-2 rounded px-2 py-1 text-xs ${
                    test.ok
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {test.ok
                    ? (t('settings.testOk') || 'Chave válida')
                    : `${t('settings.testFail') || 'Falhou'}: ${test.error ?? test.reply ?? ''}`}
                </p>
              )}

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

'use client';

import { useState, useTransition } from 'react';
import {
  saveLanguagesAction,
  saveApiKeyAction,
  saveDailyGoalAction,
  finishPlacementAction,
} from '@/app/actions/onboarding';
import { useT } from '@/lib/i18n/context';

type Question = { id: string; prompt: string; choices: string[] };

type Step = 'languages' | 'api-keys' | 'daily-goal' | 'placement';

export function OnboardingWizard({ questions }: { questions: Question[] }) {
  const t = useT();
  const [step, setStep] = useState<Step>('languages');
  const [native, setNative] = useState<'pt_BR' | 'en'>('pt_BR');
  const [target, setTarget] = useState<'pt_BR' | 'en'>('en');
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function goNext() {
    setError(null);
    if (step === 'languages') {
      await saveLanguagesAction(native, target);
      setStep('api-keys');
    } else if (step === 'api-keys') {
      const hasAny =
        claudeKey.trim() || openaiKey.trim() || openrouterKey.trim() || geminiKey.trim();
      if (!hasAny) {
        setError(t('wizard.atLeastOneKey'));
        return;
      }
      if (claudeKey.trim()) await saveApiKeyAction('claude', claudeKey.trim());
      if (openaiKey.trim()) await saveApiKeyAction('openai', openaiKey.trim());
      if (openrouterKey.trim()) await saveApiKeyAction('openrouter', openrouterKey.trim());
      if (geminiKey.trim()) await saveApiKeyAction('gemini', geminiKey.trim());
      setStep('daily-goal');
    } else if (step === 'daily-goal') {
      await saveDailyGoalAction(Number(dailyGoal) || 20);
      setStep('placement');
    }
  }

  async function finish() {
    const ordered = questions.map((q) => answers[q.id] ?? -1);
    startTransition(async () => {
      await finishPlacementAction(ordered);
    });
  }

  return (
    <main className="mx-auto mt-12 max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('wizard.title')}</h1>
      {error && (
        <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {step === 'languages' && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t('wizard.languages')}</h2>
          <label className="block">
            <span className="text-sm">{t('wizard.nativeLanguage')}</span>
            <select
              value={native}
              onChange={(e) => setNative(e.target.value as 'pt_BR' | 'en')}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="pt_BR">pt-BR</option>
              <option value="en">en</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">{t('wizard.targetLanguage')}</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as 'pt_BR' | 'en')}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="en">en</option>
              <option value="pt_BR">pt-BR</option>
            </select>
          </label>
          <NextButton onClick={goNext} label={t('wizard.next')} />
        </section>
      )}

      {step === 'api-keys' && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t('wizard.apiKeys')}</h2>
          <label className="block">
            <span className="text-sm">Claude (Anthropic)</span>
            <input
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="sk-ant-..."
            />
          </label>
          <label className="block">
            <span className="text-sm">OpenAI</span>
            <input
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="sk-..."
            />
          </label>
          <label className="block">
            <span className="text-sm">OpenRouter</span>
            <input
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="sk-or-v1-..."
            />
          </label>
          <label className="block">
            <span className="text-sm">Gemini (Google)</span>
            <input
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="AIza..."
            />
          </label>
          <NextButton onClick={goNext} label={t('wizard.next')} />
        </section>
      )}

      {step === 'daily-goal' && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t('wizard.dailyGoal')}</h2>
          <label className="block">
            <span className="text-sm">{t('wizard.dailyGoal')}</span>
            <input
              type="number"
              min={1}
              max={200}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <NextButton onClick={goNext} label={t('wizard.next')} />
        </section>
      )}

      {step === 'placement' && (
        <section className="space-y-6">
          <h2 className="text-lg font-medium">{t('wizard.placement')}</h2>
          {questions.map((q, qi) => (
            <div key={q.id} data-testid="placement-question" className="rounded border border-slate-200 p-4 dark:border-slate-800">
              <p className="mb-3 font-medium">
                {qi + 1}. {q.prompt}
              </p>
              {q.choices.map((c, ci) => (
                <label key={ci} className="flex items-center gap-2 py-1">
                  <input
                    type="radio"
                    name={q.id}
                    value={ci}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={finish}
            disabled={pending}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {t('wizard.finish')}
          </button>
        </section>
      )}
    </main>
  );
}

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
    >
      {label}
    </button>
  );
}

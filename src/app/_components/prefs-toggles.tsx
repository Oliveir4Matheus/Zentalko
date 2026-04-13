'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/context';
import type { Locale, Theme } from '@/lib/prefs';

async function persist(patch: { theme?: Theme; locale?: Locale }) {
  await fetch('/api/prefs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
    keepalive: true,
  });
}

export function PrefsToggles({ initialTheme }: { initialTheme: Theme }) {
  const router = useRouter();
  const locale = useLocale();
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    persist({ theme: next });
  }

  async function setLocale(next: Locale) {
    await persist({ locale: next });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>
      <div className="flex overflow-hidden rounded border border-slate-300 text-xs dark:border-slate-700">
        <button
          type="button"
          onClick={() => setLocale('pt-BR')}
          className={
            locale === 'pt-BR'
              ? 'bg-sky-600 px-2 py-1 text-white'
              : 'px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800'
          }
        >
          PT
        </button>
        <button
          type="button"
          onClick={() => setLocale('en')}
          className={
            locale === 'en'
              ? 'bg-sky-600 px-2 py-1 text-white'
              : 'px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800'
          }
        >
          EN
        </button>
      </div>
    </div>
  );
}

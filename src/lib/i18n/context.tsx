'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '@/lib/prefs';
import { translate } from './messages';

const LocaleContext = createContext<Locale>('pt-BR');

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useLocale();
  return (key: string) => translate(locale, key);
}

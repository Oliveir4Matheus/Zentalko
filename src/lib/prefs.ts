import { cookies } from 'next/headers';

export type Theme = 'light' | 'dark';
export type Locale = 'pt-BR' | 'en';

export interface Prefs {
  theme: Theme;
  locale: Locale;
}

const COOKIE = 'prefs';
const DEFAULT: Prefs = { theme: 'light', locale: 'pt-BR' };

export async function readPrefs(): Promise<Prefs> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      locale: parsed.locale === 'en' ? 'en' : 'pt-BR',
    };
  } catch {
    return DEFAULT;
  }
}

export async function writePrefs(prefs: Partial<Prefs>): Promise<Prefs> {
  const current = await readPrefs();
  const next: Prefs = {
    theme: prefs.theme ?? current.theme,
    locale: prefs.locale ?? current.locale,
  };
  (await cookies()).set(COOKIE, JSON.stringify(next), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return next;
}

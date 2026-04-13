/**
 * Minimal i18n runtime for tests and early-phase server code.
 *
 * The full UI uses `next-intl` (loaded from `messages/{pt,en}.json`); this
 * module is the lightweight runtime contract: `setLocale`, `getLocale`, `t`.
 * Missing keys fall back to the key itself so tests can assert safely.
 */

export type Locale = 'pt-BR' | 'en';

type Dict = Record<string, string>;

const MESSAGES: Record<Locale, Dict> = {
  'pt-BR': {
    'dashboard.title': 'Painel',
    'dashboard.greeting': 'Olá',
    'wizard.welcome': 'Bem-vindo',
    'wizard.languages': 'Idiomas',
    'wizard.apiKeys': 'Chaves de API',
    'wizard.dailyGoal': 'Meta diária',
    'wizard.placement': 'Teste de nivelamento',
    'flashcards.title': 'Flashcards',
    'reading.title': 'Leitura',
    'settings.title': 'Configurações',
  },
  en: {
    'dashboard.title': 'Dashboard',
    'dashboard.greeting': 'Hello',
    'wizard.welcome': 'Welcome',
    'wizard.languages': 'Languages',
    'wizard.apiKeys': 'API Keys',
    'wizard.dailyGoal': 'Daily goal',
    'wizard.placement': 'Placement test',
    'flashcards.title': 'Flashcards',
    'reading.title': 'Reading',
    'settings.title': 'Settings',
  },
};

let current: Locale = 'pt-BR';

export function setLocale(loc: Locale): void {
  current = loc;
}

export function getLocale(): Locale {
  return current;
}

export function t(key: string): string {
  return MESSAGES[current]?.[key] ?? key;
}

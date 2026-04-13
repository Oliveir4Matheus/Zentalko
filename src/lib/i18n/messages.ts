import pt from '@/messages/pt.json';
import en from '@/messages/en.json';
import type { Locale } from '@/lib/prefs';

type Dict = typeof pt;

export const MESSAGES: Record<Locale, Dict> = { 'pt-BR': pt, en };

function resolve(dict: Dict, path: string): string {
  const parts = path.split('.');
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === 'string' ? cur : path;
}

export function translate(locale: Locale, key: string): string {
  return resolve(MESSAGES[locale], key);
}

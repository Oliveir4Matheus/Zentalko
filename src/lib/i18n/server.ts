import { readPrefs } from '@/lib/prefs';
import { translate } from './messages';

export async function getT() {
  const { locale } = await readPrefs();
  return (key: string) => translate(locale, key);
}

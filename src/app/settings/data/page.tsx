import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/session';
import { getT } from '@/lib/i18n/server';

export default async function SettingsDataPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const t = await getT();

  return (
    <main className="mx-auto mt-10 max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('settings.dataTitle')}</h1>
      <section className="rounded border border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          {t('settings.exportDescription')}
        </p>
        <form action="/api/export" method="get">
          <button
            type="submit"
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            {t('settings.export')}
          </button>
        </form>
      </section>
    </main>
  );
}

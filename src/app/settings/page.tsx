import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/server/session';
import { saveDailyGoalAction } from '@/app/actions/settings';
import { getT } from '@/lib/i18n/server';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const t = await getT();

  return (
    <main className="mx-auto mt-10 max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('settings.title')}</h1>

      <nav className="mb-6 flex gap-4 text-sm">
        <Link href="/settings/api-keys" className="text-sky-600 underline dark:text-sky-400">
          {t('nav.apiKeys')}
        </Link>
        <Link href="/settings/data" className="text-sky-600 underline dark:text-sky-400">
          {t('nav.data')}
        </Link>
      </nav>

      <section className="rounded border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mb-3 font-medium">{t('settings.meta')}</h2>
        <form action={saveDailyGoalAction} className="flex items-end gap-2">
          <label className="flex-1">
            <span className="text-sm">{t('wizard.dailyGoal')}</span>
            <input
              name="dailyNewCardLimit"
              type="number"
              min={1}
              max={200}
              defaultValue={user.dailyNewCardLimit}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <button type="submit" className="rounded bg-sky-600 px-4 py-2 text-white">
            {t('settings.save')}
          </button>
        </form>
      </section>
    </main>
  );
}

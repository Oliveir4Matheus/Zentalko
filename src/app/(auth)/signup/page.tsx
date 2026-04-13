import { getT } from '@/lib/i18n/server';

export default async function SignupPage() {
  const t = await getT();
  return (
    <main className="mx-auto mt-20 max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('auth.signup')}</h1>
      <form action="/api/auth/signup" method="post" className="space-y-4">
        <label className="block">
          <span className="text-sm">{t('auth.email')}</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm">{t('auth.password')}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
        >
          {t('auth.signup')}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {t('auth.haveAccount')} <a href="/login" className="text-sky-600 underline">{t('auth.loginLink')}</a>
      </p>
    </main>
  );
}

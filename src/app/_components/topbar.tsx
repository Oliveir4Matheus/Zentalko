import { getCurrentUser } from '@/server/session';
import { getT } from '@/lib/i18n/server';
import { MobileNav } from './mobile-nav';

export async function TopBar() {
  const user = await getCurrentUser();
  if (!user) return null;
  const t = await getT();

  const labels = {
    dashboard: t('nav.dashboard'),
    review: t('nav.review'),
    flashcards: t('flashcards.title'),
    library: t('nav.library'),
    settings: t('nav.settings'),
    apiKeys: t('nav.apiKeys'),
  };

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="app-topbar flex h-16 items-center justify-between border-b border-border bg-bg px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <MobileNav labels={labels} />
        <p className="text-sm text-fg-muted">
          <span className="uppercase tracking-[0.16em]">Today</span>
          <span className="hidden sm:inline"> · {date}</span>
        </p>
      </div>
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-fg-muted">
        CEFR · {user.cefrLevel ?? 'A1'}
      </span>
    </header>
  );
}

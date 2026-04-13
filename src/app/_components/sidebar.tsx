import Link from 'next/link';
import {
  BookOpen,
  LayoutDashboard,
  Layers,
  GraduationCap,
  Library,
  Settings,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { getT } from '@/lib/i18n/server';
import { getCurrentUser } from '@/server/session';
import { logoutAction } from '@/app/actions/auth';
import { prisma } from '@/server/db';
import { PrefsToggles } from './prefs-toggles';
import { readPrefs } from '@/lib/prefs';

export async function Sidebar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [t, prefs, dueCount] = await Promise.all([
    getT(),
    readPrefs(),
    prisma.flashcard.count({ where: { userId: user.id, dueAt: { lte: new Date() } } }),
  ]);

  const study = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/review', icon: Layers, label: t('nav.review'), badge: dueCount > 0 ? dueCount : undefined },
    { href: '/flashcards', icon: GraduationCap, label: t('flashcards.title') },
    { href: '/library', icon: Library, label: t('nav.library') },
  ] as const;

  const account = [
    { href: '/settings/api-keys', icon: KeyRound, label: t('nav.apiKeys') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ] as const;

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex"
      data-testid="sidebar"
    >
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-2.5 border-b border-border px-6"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-md bg-accent"
          aria-hidden
        >
          <BookOpen size={16} className="text-accent-fg" />
        </span>
        <span className="serif text-lg font-semibold tracking-tight">learnEnglish</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup label={t('nav.study') !== 'nav.study' ? t('nav.study') : 'Study'} items={study} />
        <div className="mt-6" />
        <NavGroup label={t('nav.account') !== 'nav.account' ? t('nav.account') : 'Account'} items={account} />
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-1">
          <PrefsToggles initialTheme={prefs.theme} />
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-sm font-medium text-accent">
            {user.email[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.email.split('@')[0]}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label={t('auth.logout')}
              className="rounded-md p-1.5 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{ href: string; icon: React.ElementType; label: string; badge?: number }>;
}) {
  return (
    <>
      <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href as '/dashboard'}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
            >
              <it.icon size={16} className="text-fg-muted group-hover:text-accent" />
              <span className="flex-1">{it.label}</span>
              {it.badge !== undefined && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold tabular-nums text-accent-fg">
                  {it.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

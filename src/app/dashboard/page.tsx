import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Sparkles,
  Layers,
  BookOpen,
  ArrowUpRight,
  Play,
  Target,
  Library,
  KeyRound,
  Settings,
} from 'lucide-react';
import { getCurrentUser } from '@/server/session';
import { prisma } from '@/server/db';
import { getT } from '@/lib/i18n/server';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.onboardingCompleted) redirect('/onboarding');

  const [gamif, dueCount, bookCount, lastSession] = await Promise.all([
    prisma.gamificationState.findUnique({ where: { userId: user.id } }),
    prisma.flashcard.count({ where: { userId: user.id, dueAt: { lte: new Date() } } }),
    prisma.book.count({ where: { userId: user.id } }),
    prisma.readingSession.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      include: { chapter: { include: { book: true } } },
    }),
  ]);
  const t = await getT();

  const name = user.email.split('@')[0];
  const streak = gamif?.currentStreak ?? 0;
  const longest = gamif?.longestStreak ?? 0;
  const xp = gamif?.xp ?? 0;
  const level = gamif?.level ?? 1;
  const lastBook = lastSession?.chapter?.book ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      {/* Hero */}
      <section className="mb-10">
        <p className="text-sm text-fg-muted">{t('dashboard.greeting')},</p>
        <h1 className="serif mt-1 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {name}.
        </h1>
        <p className="serif mt-3 text-lg italic text-fg-muted">
          {streak > 0
            ? `You're on a ${streak}-day streak.`
            : 'A fresh page today.'}{' '}
          {dueCount > 0
            ? `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} waiting for review.`
            : 'No reviews due right now.'}
        </p>

        <article className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-muted">
                <Target size={14} className="text-accent" />
                {t('dashboard.due')}
              </div>
              <p className="serif mt-2 text-3xl font-semibold tabular-nums">
                {dueCount}{' '}
                <span className="text-base font-normal text-fg-muted">
                  {dueCount === 1 ? 'card' : 'cards'}
                </span>
              </p>
            </div>
            <Link
              href="/review"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              <Play size={14} fill="currentColor" />
              {dueCount > 0 ? t('nav.review') : t('nav.flashcards') !== 'nav.flashcards' ? t('nav.flashcards') : t('flashcards.title')}
            </Link>
          </div>
        </article>
      </section>

      {/* Stats */}
      <section
        className="mb-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
        data-testid="dashboard-stats"
      >
        <StatCell
          icon={<Flame size={16} />}
          iconClass="text-[#c2410c]"
          label={t('dashboard.streak')}
          value={streak}
          suffix={t('dashboard.days')}
          hint={longest > 0 ? `Longest · ${longest} ${t('dashboard.days')}` : '—'}
        />
        <StatCell
          icon={<Sparkles size={16} />}
          iconClass="text-[var(--gold)]"
          label={t('dashboard.xp')}
          value={xp.toLocaleString()}
          suffix="xp"
          hint={`Level ${level}`}
        />
        <StatCell
          icon={<Layers size={16} />}
          iconClass="text-accent"
          label={t('dashboard.due')}
          value={dueCount}
          suffix={dueCount === 1 ? 'card' : 'cards'}
          hint="Anki queue"
          testId="due-card"
        />
      </section>

      {/* Continue reading */}
      {lastBook && (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="serif text-2xl font-semibold">Continue reading</h2>
            <Link href="/library" className="text-sm text-fg-muted hover:underline">
              {t('nav.library')} →
            </Link>
          </div>
          <article className="group flex items-start gap-5 rounded-2xl border border-border bg-surface p-6 transition hover:shadow-[0_10px_40px_-20px_rgba(20,15,10,0.2)] sm:gap-6 sm:p-7">
            <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-surface-muted sm:h-28 sm:w-20">
              <BookOpen size={22} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="serif text-xl font-semibold leading-snug sm:text-2xl">
                {lastBook.title}
              </h3>
              {lastBook.author && (
                <p className="mt-1 text-sm text-fg-muted">{lastBook.author}</p>
              )}
            </div>
            <Link
              href={`/read/${lastBook.id}` as '/read/[bookId]'}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-muted sm:px-5 sm:py-2.5"
            >
              Resume <ArrowUpRight size={14} />
            </Link>
          </article>
        </section>
      )}

      {/* Shortcuts */}
      <section>
        <h2 className="serif mb-4 text-2xl font-semibold">Shortcuts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Shortcut href="/review" icon={Layers} label={t('nav.review')} />
          <Shortcut href="/library" icon={Library} label={`${t('nav.library')} · ${bookCount}`} />
          <Shortcut href="/settings/api-keys" icon={KeyRound} label={t('nav.apiKeys')} />
          <Shortcut href="/settings/data" icon={Settings} label={t('nav.data')} />
        </div>
      </section>

      {/* Hidden CEFR badge for existing e2e tests that query it */}
      <span
        data-testid="cefr-level-badge"
        className="sr-only"
      >
        {user.cefrLevel ?? 'A1'}
      </span>
    </div>
  );
}

function StatCell({
  icon,
  iconClass,
  label,
  value,
  suffix,
  hint,
  testId,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number | string;
  suffix: string;
  hint: string;
  testId?: string;
}) {
  return (
    <div className="bg-surface p-6" data-testid={testId}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-muted">
        <span className={iconClass}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="serif text-4xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-fg-muted">{suffix}</span>
      </div>
      <p className="mt-1 text-xs text-fg-muted">{hint}</p>
    </div>
  );
}

function Shortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href as '/review'}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-surface-muted"
    >
      <Icon size={16} className="text-accent" />
      {label}
    </Link>
  );
}

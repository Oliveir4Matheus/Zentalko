import {
  BookOpen,
  Flame,
  Sparkles,
  Layers,
  Library,
  Settings,
  KeyRound,
  Target,
  LayoutDashboard,
  GraduationCap,
  LogOut,
  Trophy,
  Heart,
  ArrowUpRight,
  Play,
} from 'lucide-react';

const mock = {
  name: 'matheus',
  email: 'matheus@example.com',
  cefr: 'B1',
  streak: 12,
  longestStreak: 24,
  xp: 2480,
  xpToday: 30,
  goalToday: 50,
  due: 17,
  hearts: 4,
  currentBook: {
    title: 'The Old Man and the Sea',
    author: 'Ernest Hemingway',
    chapter: 'Chapter 3',
    progress: 0.42,
  },
};

export default function FinalPreview() {
  const goalPct = Math.min(1, mock.xpToday / mock.goalToday);

  return (
    <main className="theme-readwise min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <TopBar />
          <div className="mx-auto max-w-5xl px-8 py-10">
            <Hero goalPct={goalPct} />
            <StatsRow />
            <ContinueReading />
            <DailyQuests />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────── Sidebar ───────────────────────── */

function Sidebar() {
  const nav = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Layers, label: 'Review', badge: mock.due },
    { icon: GraduationCap, label: 'Flashcards' },
    { icon: Library, label: 'Library' },
    { icon: Trophy, label: 'Progress' },
  ];
  const secondary = [
    { icon: KeyRound, label: 'API Keys' },
    { icon: Settings, label: 'Settings' },
  ];
  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r md:flex"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex h-16 items-center gap-2 px-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: 'var(--accent)' }}
        >
          <BookOpen size={16} color="var(--accent-fg)" />
        </div>
        <span className="serif text-lg font-semibold tracking-tight">learnEnglish</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--fg-muted)' }}>
          Study
        </p>
        <ul className="space-y-0.5">
          {nav.map((it) => (
            <NavItem key={it.label} {...it} />
          ))}
        </ul>
        <p className="mt-6 px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--fg-muted)' }}>
          Account
        </p>
        <ul className="space-y-0.5">
          {secondary.map((it) => (
            <NavItem key={it.label} {...it} />
          ))}
        </ul>
      </nav>

      <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
            style={{ background: 'var(--surface-muted)', color: 'var(--accent)' }}
          >
            {mock.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{mock.name}</p>
            <p className="truncate text-xs" style={{ color: 'var(--fg-muted)' }}>
              {mock.email}
            </p>
          </div>
          <button
            className="rounded-md p-1.5 transition hover:bg-[var(--surface-muted)]"
            style={{ color: 'var(--fg-muted)' }}
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <li>
      <a
        href="#"
        className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition"
        style={{
          background: active ? 'var(--surface-muted)' : 'transparent',
          color: active ? 'var(--fg)' : 'var(--fg-muted)',
          fontWeight: active ? 600 : 500,
        }}
      >
        <Icon size={16} style={{ color: active ? 'var(--accent)' : 'var(--fg-muted)' }} />
        <span className="flex-1">{label}</span>
        {badge !== undefined && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {badge}
          </span>
        )}
      </a>
    </li>
  );
}

/* ───────────────────────── Top bar ───────────────────────── */

function TopBar() {
  return (
    <header
      className="flex h-16 items-center justify-between border-b px-8"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
        <span className="uppercase tracking-[0.16em]">Today</span> · Sunday, April 12
      </p>
      <div className="flex items-center gap-4">
        <Pill icon={<Flame size={14} />} value={mock.streak} color="#c2410c" />
        <Pill icon={<Sparkles size={14} />} value={mock.xp.toLocaleString()} color="#a16207" />
        <Pill icon={<Heart size={14} />} value={mock.hearts} color="#b91c1c" />
        <span
          className="rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
        >
          CEFR · {mock.cefr}
        </span>
      </div>
    </header>
  );
}

function Pill({ icon, value, color }: { icon: React.ReactNode; value: string | number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums"
      style={{ color }}
    >
      {icon}
      {value}
    </span>
  );
}

/* ───────────────────────── Hero / Daily Goal ───────────────────────── */

function Hero({ goalPct }: { goalPct: number }) {
  return (
    <section className="mb-10">
      <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
        Good evening,
      </p>
      <h1 className="serif mt-1 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {mock.name}.
      </h1>
      <p className="serif mt-3 text-lg italic" style={{ color: 'var(--fg-muted)' }}>
        You&apos;re on a {mock.streak}-day streak. {mock.goalToday - mock.xpToday} XP to today&apos;s goal.
      </p>

      <article
        className="mt-8 overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between gap-6 p-7">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--fg-muted)' }}>
              <Target size={14} style={{ color: 'var(--accent)' }} />
              Daily goal
            </div>
            <p className="serif mt-2 text-2xl font-semibold">
              {mock.xpToday}{' '}
              <span className="text-base font-normal" style={{ color: 'var(--fg-muted)' }}>
                / {mock.goalToday} XP
              </span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${goalPct * 100}%`, background: 'var(--accent)' }}
              />
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Play size={14} fill="currentColor" />
            Start review
          </button>
        </div>
      </article>
    </section>
  );
}

/* ───────────────────────── Stats ───────────────────────── */

function StatsRow() {
  return (
    <section className="mb-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-3"
      style={{ borderColor: 'var(--border)', background: 'var(--border)' }}
    >
      <StatCell
        icon={<Flame size={16} />}
        iconColor="#c2410c"
        label="Streak"
        value={mock.streak}
        suffix="days"
        hint={`Longest · ${mock.longestStreak} days`}
      />
      <StatCell
        icon={<Sparkles size={16} />}
        iconColor="#a16207"
        label="Experience"
        value={mock.xp.toLocaleString()}
        suffix="xp"
        hint="Level 7"
      />
      <StatCell
        icon={<Layers size={16} />}
        iconColor="var(--accent)"
        label="Due for review"
        value={mock.due}
        suffix="cards"
        hint="Anki queue"
      />
    </section>
  );
}

function StatCell({
  icon,
  iconColor,
  label,
  value,
  suffix,
  hint,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number | string;
  suffix: string;
  hint: string;
}) {
  return (
    <div className="p-6" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--fg-muted)' }}>
        <span style={{ color: iconColor }}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="serif text-4xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          {suffix}
        </span>
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
        {hint}
      </p>
    </div>
  );
}

/* ───────────────────────── Continue reading ───────────────────────── */

function ContinueReading() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="serif text-2xl font-semibold">Continue reading</h2>
        <a className="text-sm hover:underline" style={{ color: 'var(--fg-muted)' }} href="#">
          Library →
        </a>
      </div>
      <article
        className="group flex items-start gap-6 rounded-2xl border p-7 transition hover:shadow-[0_10px_40px_-20px_rgba(20,15,10,0.2)]"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div
          className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'var(--surface-muted)' }}
        >
          <BookOpen size={24} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--fg-muted)' }}>
            {mock.currentBook.chapter}
          </p>
          <h3 className="serif mt-1 text-2xl font-semibold leading-snug">{mock.currentBook.title}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
            {mock.currentBook.author}
          </p>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${mock.currentBook.progress * 100}%`, background: 'var(--accent)' }}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: 'var(--fg-muted)' }}>
              {Math.round(mock.currentBook.progress * 100)}%
            </span>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          Resume <ArrowUpRight size={14} />
        </button>
      </article>
    </section>
  );
}

/* ───────────────────────── Daily quests ───────────────────────── */

function DailyQuests() {
  const quests = [
    { icon: Layers, label: 'Review 20 cards', progress: 14, total: 20, reward: 20 },
    { icon: BookOpen, label: 'Read for 10 minutes', progress: 6, total: 10, reward: 15 },
    { icon: Sparkles, label: 'Learn 5 new words', progress: 2, total: 5, reward: 15 },
  ];
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="serif text-2xl font-semibold">Today&apos;s quests</h2>
        <span className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--fg-muted)' }}>
          Resets in 4h 22m
        </span>
      </div>
      <ul className="grid gap-3">
        {quests.map((q) => {
          const pct = q.progress / q.total;
          const done = pct >= 1;
          return (
            <li
              key={q.label}
              className="flex items-center gap-5 rounded-xl border p-5"
              style={{
                borderColor: 'var(--border)',
                background: done ? 'var(--surface-muted)' : 'var(--surface)',
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--surface-muted)', color: 'var(--accent)' }}
              >
                <q.icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{q.label}</p>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--fg-muted)' }}>
                    {q.progress} / {q.total}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct * 100}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium tabular-nums"
                style={{ borderColor: 'var(--border)', color: '#a16207' }}
              >
                <Sparkles size={12} />+{q.reward}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

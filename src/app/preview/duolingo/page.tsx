import { BookOpen, Flame, Zap, Trophy, Play, Heart, Star, Target } from 'lucide-react';

const mock = {
  name: 'matheus',
  cefr: 'B1',
  streak: 12,
  xp: 2480,
  due: 17,
  hearts: 4,
  gems: 320,
  goalToday: 50,
  xpToday: 30,
  currentBook: { title: 'The Old Man and the Sea', progress: 0.42 },
};

export default function DuolingoPreview() {
  const goalPct = Math.min(1, mock.xpToday / mock.goalToday);
  return (
    <main className="theme-duolingo min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="display text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            learnEnglish
          </div>
          <div className="flex items-center gap-3">
            <Pill icon={<Flame size={18} fill="#ff9600" stroke="#ff9600" />} value={mock.streak} color="#ff9600" />
            <Pill icon={<Zap size={18} fill="var(--gold)" stroke="var(--gold)" />} value={mock.gems} color="var(--gold)" />
            <Pill icon={<Heart size={18} fill="#ff4b4b" stroke="#ff4b4b" />} value={mock.hearts} color="#ff4b4b" />
            <span
              className="rounded-full px-3 py-1.5 text-xs font-bold uppercase"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              {mock.cefr}
            </span>
          </div>
        </header>

        <section className="mb-8">
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)', boxShadow: 'var(--shadow-chunk)' }}
          >
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">Hey, {mock.name}!</p>
            <h1 className="display mt-1 text-4xl font-black leading-tight">Ready for today?</h1>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>Daily goal</span>
                  <span>
                    {mock.xpToday} / {mock.goalToday} XP
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${goalPct * 100}%` }}
                  />
                </div>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-wide transition active:translate-y-1"
                style={{
                  background: '#fff',
                  color: 'var(--accent)',
                  boxShadow: '0 4px 0 0 rgba(0,0,0,0.12)',
                }}
              >
                <Play size={16} fill="currentColor" />
                Start
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            icon={<Flame size={22} fill="#ff9600" stroke="#ff9600" />}
            label="Streak"
            value={mock.streak}
            suffix="days"
            color="#ff9600"
          />
          <Stat
            icon={<Star size={22} fill="var(--gold)" stroke="var(--gold)" />}
            label="Total XP"
            value={mock.xp}
            suffix="xp"
            color="var(--gold)"
          />
          <Stat
            icon={<Target size={22} fill="var(--blue)" stroke="#fff" strokeWidth={2} />}
            label="To review"
            value={mock.due}
            suffix="cards"
            color="var(--blue)"
          />
        </section>

        <section className="mb-8">
          <h2 className="display mb-4 text-xl font-black uppercase" style={{ color: 'var(--fg-muted)' }}>
            Keep reading
          </h2>
          <div
            className="flex items-center gap-5 rounded-2xl border-2 bg-white p-5"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'var(--blue)', boxShadow: '0 4px 0 0 var(--blue-shadow)' }}
            >
              <BookOpen size={28} color="#fff" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold">{mock.currentBook.title}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${mock.currentBook.progress * 100}%`, background: 'var(--accent)' }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>
                  {Math.round(mock.currentBook.progress * 100)}%
                </span>
              </div>
            </div>
            <button
              className="rounded-xl px-5 py-2.5 text-sm font-black uppercase text-white transition active:translate-y-1"
              style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-chunk)' }}
            >
              Continue
            </button>
          </div>
        </section>

        <section>
          <h2 className="display mb-4 text-xl font-black uppercase" style={{ color: 'var(--fg-muted)' }}>
            Quests
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Quest icon={<Target size={22} />} label="Review" accent="var(--accent)" />
            <Quest icon={<BookOpen size={22} />} label="Library" accent="var(--blue)" />
            <Quest icon={<Trophy size={22} />} label="Leagues" accent="var(--gold)" />
            <Quest icon={<Zap size={22} />} label="Shop" accent="#ce82ff" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Pill({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 text-sm font-black tabular-nums"
      style={{ borderColor: 'var(--border)', color }}
    >
      {icon}
      {value}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl border-2 bg-white p-5"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color }}>
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="display text-4xl font-black tabular-nums" style={{ color: 'var(--fg)' }}>
          {value.toLocaleString()}
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}

function Quest({ icon, label, accent }: { icon: React.ReactNode; label: string; accent: string }) {
  return (
    <a
      href="#"
      className="group flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-4 transition active:translate-y-1"
      style={{ borderColor: 'var(--border)' }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white transition group-hover:scale-105"
        style={{ background: accent, boxShadow: `0 4px 0 0 rgba(0,0,0,0.15)` }}
      >
        {icon}
      </span>
      <span className="text-sm font-black uppercase" style={{ color: 'var(--fg)' }}>
        {label}
      </span>
    </a>
  );
}

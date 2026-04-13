import { BookOpen, Flame, Sparkles, Library, Layers, Settings, KeyRound, ArrowUpRight } from 'lucide-react';

const mock = {
  name: 'matheus',
  cefr: 'B1',
  streak: 12,
  xp: 2480,
  due: 17,
  currentBook: { title: 'The Old Man and the Sea', author: 'Ernest Hemingway', progress: 0.42, chapter: 'Chapter 3' },
  recent: [
    { title: 'Pride and Prejudice', author: 'Jane Austen', progress: 0.18 },
    { title: 'Animal Farm', author: 'George Orwell', progress: 0.73 },
    { title: 'The Great Gatsby', author: 'F. S. Fitzgerald', progress: 0.05 },
  ],
};

export default function ReadwisePreview() {
  return (
    <main className="theme-readwise min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-14 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em]" style={{ color: 'var(--fg-muted)' }}>
              Today · April 12
            </p>
            <h1 className="serif mt-2 text-5xl font-semibold leading-tight tracking-tight">
              Good evening, {mock.name}.
            </h1>
            <p className="serif mt-3 text-lg italic" style={{ color: 'var(--fg-muted)' }}>
              Twelve quiet days in a row. Keep the thread.
            </p>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
          >
            CEFR · {mock.cefr}
          </span>
        </header>

        <section className="mb-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-3"
          style={{ borderColor: 'var(--border)', background: 'var(--border)' }}
        >
          <Stat icon={<Flame size={18} />} label="Streak" value={`${mock.streak}`} suffix="days" />
          <Stat icon={<Sparkles size={18} />} label="Experience" value={mock.xp.toLocaleString()} suffix="xp" />
          <Stat icon={<Layers size={18} />} label="Due for review" value={`${mock.due}`} suffix="cards" />
        </section>

        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="serif text-2xl font-semibold">Continue reading</h2>
            <a className="text-sm hover:underline" style={{ color: 'var(--fg-muted)' }} href="#">
              Library →
            </a>
          </div>
          <article
            className="group relative overflow-hidden rounded-xl border p-8 transition hover:shadow-[0_10px_40px_-20px_rgba(20,15,10,0.2)]"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-start gap-6">
              <div
                className="flex h-28 w-20 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'var(--surface-muted)' }}
              >
                <BookOpen size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                  {mock.currentBook.chapter}
                </p>
                <h3 className="serif mt-1 text-2xl font-semibold">{mock.currentBook.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
                  {mock.currentBook.author}
                </p>
                <div className="mt-6 flex items-center gap-4">
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
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                Resume <ArrowUpRight size={14} />
              </button>
            </div>
          </article>
        </section>

        <section className="mb-12">
          <h2 className="serif mb-4 text-2xl font-semibold">Shelf</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {mock.recent.map((b) => (
              <div
                key={b.title}
                className="rounded-lg border p-5 transition hover:-translate-y-0.5"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <p className="serif text-base font-medium leading-snug">{b.title}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
                  {b.author}
                </p>
                <div className="mt-4 h-0.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                  <div className="h-full" style={{ width: `${b.progress * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="serif mb-4 text-2xl font-semibold">Shortcuts</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Shortcut icon={<Layers size={16} />} label="Review" />
            <Shortcut icon={<Library size={16} />} label="Library" />
            <Shortcut icon={<KeyRound size={16} />} label="API Keys" />
            <Shortcut icon={<Settings size={16} />} label="Settings" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix: string }) {
  return (
    <div className="p-6" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="serif text-4xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}

function Shortcut({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <a
      href="#"
      className="flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      {label}
    </a>
  );
}

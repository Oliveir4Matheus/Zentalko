import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  Sparkles,
  KeyRound,
  Flame,
  Target,
  ArrowRight,
  Upload,
  Brain,
  Trophy,
  Quote,
} from 'lucide-react';
import { getCurrentUser } from '@/server/session';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompleted ? '/dashboard' : '/onboarding');

  return (
    <div className="bg-bg text-fg">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Gamification />
      <ClosingCTA />
      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <BookOpen size={16} className="text-accent-fg" />
          </span>
          <span className="serif text-lg font-semibold tracking-tight">learnEnglish</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-fg-muted sm:flex">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#how" className="hover:text-fg">How it works</a>
          <a href="#gamification" className="hover:text-fg">Progress</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-fg-muted transition hover:text-fg"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            Criar conta
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr,1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
            <Sparkles size={12} className="text-accent" />
            Aprenda inglês lendo o que você ama
          </span>
          <h1 className="serif mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Um diário silencioso para <em className="italic text-accent">aprender inglês</em> todos os dias.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            Importe um EPUB, leia com traduções sob demanda, transforme palavras
            em flashcards com FSRS e mantenha seu streak vivo. Sem ruído, sem ads,
            sua chave de IA fica com você.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              Criar conta grátis
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:bg-surface-muted"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-xs text-fg-muted">
            BYOK · Sem cartão · Seus dados ficam no seu navegador e no seu banco.
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(139,94,52,0.12),transparent_60%)]" />
      <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-30px_rgba(20,15,10,0.25)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-fg-muted">
          <span className="uppercase tracking-[0.16em]">Today · April 12</span>
          <span className="inline-flex items-center gap-1 text-[#c2410c]">
            <Flame size={12} /> 12
          </span>
        </div>
        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">Continue reading</p>
          <h3 className="serif mt-2 text-2xl font-semibold leading-snug">The Old Man and the Sea</h3>
          <p className="mt-1 text-sm text-fg-muted">Ernest Hemingway · Chapter 3</p>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: '42%' }} />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
            <MiniStat icon={<Flame size={12} />} color="#c2410c" label="Streak" value="12" />
            <MiniStat icon={<Sparkles size={12} />} color="var(--gold)" label="XP" value="2,480" />
            <MiniStat icon={<Layers size={12} />} color="var(--accent)" label="Due" value="17" />
          </div>
        </div>
      </article>
    </div>
  );
}

function MiniStat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-fg-muted" style={{ color }}>
        {icon}
        <span className="text-fg-muted">{label}</span>
      </div>
      <p className="serif mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: BookOpen,
      title: 'Leitura assistida',
      body: 'Importe EPUBs ou cole textos. Toque em qualquer palavra e a IA traduz, explica e contextualiza sem tirar você da página.',
    },
    {
      icon: Brain,
      title: 'Flashcards com FSRS',
      body: 'Cada palavra salva vira um cartão com espaçamento ótimo. Você revê no momento certo — nem antes, nem depois.',
    },
    {
      icon: KeyRound,
      title: 'BYOK, sua IA, sua chave',
      body: 'Conecte Claude, OpenAI ou Gemini com a sua própria API key. Criptografada no banco, nunca compartilhada.',
    },
    {
      icon: Trophy,
      title: 'Progresso que motiva',
      body: 'Streak diário, XP, nível e CEFR. Gamificação honesta — recompensa tempo real de estudo, não cliques vazios.',
    },
  ];
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-fg-muted">What&apos;s inside</p>
          <h2 className="serif mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Quatro peças que trabalham juntas.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Cada recurso existe por um motivo: ler, entender, fixar, persistir.
            Nada além disso.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((it) => (
            <article
              key={it.title}
              className="group rounded-2xl border border-border bg-surface p-7 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-30px_rgba(20,15,10,0.25)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted">
                <it.icon size={20} className="text-accent" />
              </div>
              <h3 className="serif mt-5 text-2xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-fg-muted">{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: Upload,
      title: 'Importe um livro',
      body: 'Arraste um EPUB ou cole um texto em inglês. Em segundos ele está indexado e pronto para leitura.',
    },
    {
      n: '02',
      icon: BookOpen,
      title: 'Leia e toque',
      body: 'Toque em palavras desconhecidas. A IA traduz, exemplifica, e você decide se salva para revisão.',
    },
    {
      n: '03',
      icon: Layers,
      title: 'Revise com FSRS',
      body: 'Todo dia, uma fila curta de cartões no ponto certo. Sem avalanche, sem esquecimento.',
    },
    {
      n: '04',
      icon: Target,
      title: 'Mantenha o streak',
      body: 'Um dia, dois dias, doze dias. Um hábito silencioso que se prova sozinho.',
    },
  ];
  return (
    <section id="how" className="border-b border-border bg-surface-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-fg-muted">Como funciona</p>
          <h2 className="serif mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Quatro passos. Repetidos por anos.
          </h2>
        </div>
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-border bg-surface p-6">
              <span className="serif absolute -top-3 left-6 bg-bg px-2 text-xs font-semibold tracking-wider text-fg-muted">
                {s.n}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">
                <s.icon size={18} className="text-accent" />
              </div>
              <h3 className="serif mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Gamification() {
  return (
    <section id="gamification" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-fg-muted">Progresso</p>
            <h2 className="serif mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Gamificação sem ansiedade.
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              Streak, XP e nível são honestos — medem tempo real de estudo.
              Você vê o progresso sem que ele vire chicote.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Flame, color: '#c2410c', text: 'Streak diário com meta flexível' },
                { icon: Sparkles, color: 'var(--gold)', text: 'XP e nível baseados em cartões revisados' },
                { icon: Target, color: 'var(--accent)', text: 'Fila Anki/FSRS priorizada automaticamente' },
              ].map((l) => (
                <li key={l.text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted" style={{ color: l.color }}>
                    <l.icon size={16} />
                  </span>
                  <span className="text-fg">{l.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="rounded-2xl border border-border bg-surface p-8">
            <Quote size={28} className="text-accent" />
            <blockquote className="serif mt-6 text-2xl font-medium leading-snug">
              &ldquo;Antes eu abria Duolingo por obrigação. Agora leio Hemingway
              no ônibus, toco em duas palavras, e volto pra casa com um streak de
              quarenta dias.&rdquo;
            </blockquote>
            <figcaption className="mt-6 text-sm text-fg-muted">
              — Leitor beta, B1 → B2 em cinco meses
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Abra um livro hoje.
        </h2>
        <p className="mt-4 text-lg text-fg-muted">
          Grátis, open source e seu. Sem cartão, sem trial, sem truques.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            Criar conta grátis
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:bg-surface-muted"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-fg-muted">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <BookOpen size={12} className="text-accent-fg" />
          </span>
          <span className="serif font-semibold text-fg">learnEnglish</span>
        </div>
        <p>Feito para quem quer ler inglês de verdade.</p>
      </div>
    </footer>
  );
}

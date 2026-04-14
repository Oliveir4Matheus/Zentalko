'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_ACTIONS = [
  { label: 'Explique a gramática desta frase', prompt: 'Explique a gramática desta frase destacada.' },
  { label: 'O que é difícil nesta página?', prompt: 'O que é mais difícil de entender nesta página? Explique brevemente.' },
  { label: '3 sinônimos', prompt: 'Me dê 3 sinônimos da palavra/expressão destacada com exemplos de uso.' },
  { label: 'Crie um exercício', prompt: 'Crie um exercício curto de preenchimento de lacuna usando a palavra destacada.' },
];

export function TutorPanel({
  chapterId,
  getPageText,
  selection,
  onClearSelection,
}: {
  chapterId: string;
  getPageText: () => string;
  selection: string | null;
  onClearSelection: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = trpc.reading.askTutor.useMutation();

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, ask.isPending]);

  async function send(contentOverride?: string) {
    const content = (contentOverride ?? input).trim();
    if (!content) return;
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    try {
      // Rolling window: only send the last 6 turns so the prompt stays lean.
      const window = next.slice(-6);
      const res = await ask.mutateAsync({
        chapterId,
        messages: window,
        pageText: getPageText().slice(0, 2500) || undefined,
        selection: selection ?? undefined,
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `⚠️ ${(err as Error).message || 'Erro ao consultar o tutor.'}`,
        },
      ]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir tutor"
        className="rounded-full border border-[color:var(--paper-border,#e6dcc6)] bg-white/60 p-2 text-[color:var(--ink,#2a2218)] transition hover:bg-white"
      >
        <MessageCircle size={14} />
      </button>

      {open && (
        <aside
          className="fixed right-0 top-0 z-40 flex h-full w-full max-w-[380px] flex-col border-l border-border bg-surface shadow-xl sm:w-[380px]"
          role="complementary"
          aria-label="Tutor"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-fg-muted">Tutor</p>
              <p className="text-sm font-medium text-fg">Tire suas dúvidas sobre o livro</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar tutor"
              className="rounded-full p-1 text-fg-muted hover:bg-surface-muted"
            >
              <X size={16} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !ask.isPending && (
              <p className="text-sm text-fg-muted">
                Pergunte qualquer coisa sobre o trecho que você está lendo. Selecione um texto antes para dar contexto à sua pergunta.
              </p>
            )}
            <ul className="space-y-3">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-accent text-accent-fg'
                      : 'bg-surface-muted text-fg'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
              {ask.isPending && (
                <li className="max-w-[60%] rounded-2xl bg-surface-muted px-3 py-2 text-sm italic text-fg-muted">
                  pensando…
                </li>
              )}
            </ul>
          </div>

          <div className="border-t border-border px-3 py-2">
            {selection && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-2 py-1.5 text-xs">
                <span className="flex-1 truncate italic text-fg-muted" title={selection}>
                  contexto: &ldquo;{selection.slice(0, 80)}
                  {selection.length > 80 ? '…' : ''}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={onClearSelection}
                  aria-label="Limpar contexto"
                  className="text-fg-muted hover:text-fg"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={ask.isPending}
                  onClick={() => send(q.prompt)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-fg-muted transition hover:bg-surface-muted hover:text-fg disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Pergunte em português ou inglês…"
                className="flex-1 resize-none rounded-lg border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={ask.isPending || !input.trim()}
                aria-label="Enviar"
                className="rounded-full bg-accent p-2 text-accent-fg transition hover:opacity-90 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}

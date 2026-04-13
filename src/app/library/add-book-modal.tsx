'use client';

import { useState } from 'react';
import { Plus, Upload, FileText, X } from 'lucide-react';
import { EpubUpload } from './upload';
import { createFromTextAction } from '@/app/actions/library';
import { useT } from '@/lib/i18n/context';

type Tab = 'epub' | 'text';

export function AddBookModal() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('epub');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
      >
        <Plus size={16} />
        Adicionar livro
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="serif text-lg font-semibold">Adicionar livro</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-fg-muted hover:bg-surface-muted"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-1 border-b border-border px-5 pt-3">
              <TabButton active={tab === 'epub'} onClick={() => setTab('epub')}>
                <Upload size={14} /> {t('library.importEpub')}
              </TabButton>
              <TabButton active={tab === 'text'} onClick={() => setTab('text')}>
                <FileText size={14} /> {t('library.createText')}
              </TabButton>
            </div>

            <div className="p-5">
              {tab === 'epub' ? (
                <EpubUpload />
              ) : (
                <form action={createFromTextAction} className="space-y-2">
                  <input
                    name="title"
                    placeholder={t('library.titlePlaceholder')}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
                  />
                  <textarea
                    name="text"
                    placeholder={t('library.textPlaceholder')}
                    rows={6}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
                  >
                    {t('library.create')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-sm transition ${
        active
          ? 'border-accent font-medium text-fg'
          : 'border-transparent text-fg-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadEpubAction } from '@/app/actions/library';
import { useT } from '@/lib/i18n/context';

export function EpubUpload() {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    setError(null);
    startTransition(async () => {
      try {
        await uploadEpubAction(fd);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form ref={formRef} className="flex min-w-0 flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        accept=".epub,application/epub+zip"
        data-testid="epub-upload"
        onChange={onChange}
        disabled={pending}
        className="block w-full min-w-0 max-w-full truncate text-sm file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-2 file:py-1 file:text-sm"
      />
      {pending && <span className="text-xs text-slate-500 dark:text-slate-400">{t('library.importing')}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  );
}

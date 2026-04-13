'use client';

import { Trash2 } from 'lucide-react';

export function DeleteBookButton({ title }: { title: string }) {
  return (
    <button
      type="submit"
      aria-label={`Delete ${title}`}
      onClick={(e) => {
        if (!confirm(`Remover "${title}"? Essa ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
      className="rounded-full border border-border p-2 text-fg-muted transition hover:border-[color:var(--danger,#b91c1c)] hover:bg-[color:var(--danger,#b91c1c)]/10 hover:text-[color:var(--danger,#b91c1c)]"
    >
      <Trash2 size={15} />
    </button>
  );
}

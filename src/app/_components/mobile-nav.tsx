'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Layers, GraduationCap, Library, Settings, KeyRound, BookOpen } from 'lucide-react';

export function MobileNav({
  labels,
}: {
  labels: {
    dashboard: string;
    review: string;
    flashcards: string;
    library: string;
    settings: string;
    apiKeys: string;
  };
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { href: '/dashboard', icon: LayoutDashboard, label: labels.dashboard },
    { href: '/review', icon: Layers, label: labels.review },
    { href: '/flashcards', icon: GraduationCap, label: labels.flashcards },
    { href: '/library', icon: Library, label: labels.library },
    { href: '/settings/api-keys', icon: KeyRound, label: labels.apiKeys },
    { href: '/settings', icon: Settings, label: labels.settings },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
      >
        <Menu size={18} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            className="absolute inset-0 flex h-full w-full flex-col gap-1 bg-surface p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between border-b border-border px-3 py-3">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
                  <BookOpen size={14} className="text-accent-fg" />
                </span>
                <span className="serif text-base font-semibold">learnEnglish</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-fg-muted hover:bg-surface-muted"
              >
                <X size={16} />
              </button>
            </div>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href as '/dashboard'}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-muted hover:text-fg"
              >
                <it.icon size={16} className="text-fg-muted" />
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

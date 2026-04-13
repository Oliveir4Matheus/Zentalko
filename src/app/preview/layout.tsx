import { Inter, Fraunces, Nunito, DynaPuff } from 'next/font/google';
import Link from 'next/link';
import './preview.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-rounded', display: 'swap' });
const dyna = DynaPuff({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${fraunces.variable} ${nunito.variable} ${dyna.variable}`}>
      <div className="fixed right-4 top-4 z-50 flex gap-2 rounded-full border border-neutral-200 bg-white/90 p-1 shadow-sm backdrop-blur">
        <Link
          href="/preview/readwise"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Readwise
        </Link>
        <Link
          href="/preview/duolingo"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Duolingo
        </Link>
        <Link
          href="/preview/final"
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
        >
          Final
        </Link>
      </div>
      {children}
    </div>
  );
}

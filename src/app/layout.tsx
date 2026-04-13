import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Providers } from './providers';
import { LocaleProvider } from '@/lib/i18n/context';
import { readPrefs } from '@/lib/prefs';
import { Sidebar } from './_components/sidebar';
import { TopBar } from './_components/topbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: 'learnEnglish',
  description: 'PWA para aprender inglês',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await readPrefs();
  return (
    <html
      lang={prefs.locale}
      className={`${inter.variable} ${fraunces.variable}${prefs.theme === 'dark' ? ' dark' : ''}`}
    >
      <body>
        <LocaleProvider locale={prefs.locale}>
          <Providers>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-h-screen flex-1 flex-col">
                <TopBar />
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}

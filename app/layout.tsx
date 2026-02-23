import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ahana Development Tracker',
  description: 'Track daily development activities and food intake for toddlers.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6">
          <nav className="mb-4 flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-sm">
            <Link className="text-sm font-semibold text-brand-600" href="/">
              Home
            </Link>
            <Link className="text-sm font-semibold text-brand-600" href="/dashboard">
              Parent Dashboard
            </Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}

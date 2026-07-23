import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { authConfigured } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Ahana's Development Tracker",
  description: 'Track daily development activities and food intake for toddlers.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6">
          <nav className="mb-4 flex items-center justify-between rounded-2xl bg-white/90 p-3 shadow-sm">
            <div className="flex items-center gap-4">
              <Link className="text-sm font-semibold text-brand-600" href="/">
                Home
              </Link>
              <Link className="text-sm font-semibold text-brand-600" href="/growth">
                Growth
              </Link>
              <Link className="text-sm font-semibold text-brand-600" href="/meal-plan">
                Meal Plan
              </Link>
              <Link className="text-sm font-semibold text-brand-600" href="/things-to-do">
                Things To Do
              </Link>
              <Link className="text-sm font-semibold text-brand-600" href="/dashboard">
                Parent Dashboard
              </Link>
              <Link className="text-sm font-semibold text-brand-600" href="/audit">
                Audit History
              </Link>
            </div>
            {authConfigured() && (
              <a className="text-sm font-semibold text-slate-400 hover:text-slate-600" href="/api/logout">
                Log out
              </a>
            )}
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}

'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
        window.location.href = next && next.startsWith('/') ? next : '/';
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error || 'Invalid username or password');
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-white">Ahana&apos;s Tracker</h1>
      <p className="mt-1 text-sm text-slate-400">Please sign in to continue.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Username
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="futuristic-input h-11"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="futuristic-input h-11"
            required
          />
        </label>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="futuristic-button w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

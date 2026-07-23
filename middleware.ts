import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, authConfigured, verifySession } from '@/lib/auth';

// Scheduled jobs authenticate with their own CRON_SECRET bearer, so they must
// bypass the session gate (Vercel's scheduler has no login cookie).
const CRON_PATHS = ['/api/push-send', '/api/discover-events', '/api/weekend-digest'];
const OPEN_PATHS = ['/login', '/api/login', '/api/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!authConfigured()) return NextResponse.next();
  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();
  if (CRON_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(token)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  if (pathname && pathname !== '/') url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static assets (incl. the service
  // worker and banner image) so those load without a session.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|jungle-banner.svg|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webmanifest|json)$).*)']
};

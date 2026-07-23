import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

// GET so a plain link can log out; clears the cookie and returns to /login.
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}

// Lightweight session auth for a single-family app. Credentials come from env
// (APP_AUTH_USERNAME / APP_AUTH_PASSWORD); the session cookie is an HMAC-signed
// token verified in middleware. Uses Web Crypto only, so it runs on the Edge.

export const SESSION_COOKIE = 'ahana_session';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const enc = new TextEncoder();

function signingSecret(): string {
  return process.env.AUTH_SECRET || process.env.APP_AUTH_PASSWORD || 'insecure-dev-secret';
}

// Auth is only enforced once a password is configured — keeps local/preview and
// pre-configuration deploys from locking anyone out.
export function authConfigured(): boolean {
  return Boolean(process.env.APP_AUTH_PASSWORD);
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.APP_AUTH_USERNAME || 'admin';
  const expectedPass = process.env.APP_AUTH_PASSWORD || '';
  return Boolean(expectedPass) && username === expectedUser && password === expectedPass;
}

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToString(b64: string): string {
  return atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(signingSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toB64Url(new Uint8Array(buf));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function signSession(): Promise<string> {
  const data = toB64Url(enc.encode(JSON.stringify({ v: 1, iat: Date.now() })));
  const sig = await hmac(data);
  return `${data}.${sig}`;
}

export async function verifySession(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const [data, sig] = token.split('.');
  if (!data || !sig) return false;
  const expected = await hmac(data);
  if (!safeEqual(sig, expected)) return false;
  try {
    const payload = JSON.parse(b64UrlToString(data)) as { iat?: number };
    if (typeof payload.iat !== 'number') return false;
    return Date.now() - payload.iat <= MAX_AGE_MS;
  } catch {
    return false;
  }
}

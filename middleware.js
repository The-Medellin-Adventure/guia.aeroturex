// Vercel Routing Middleware runs on the Edge, before any static file or
// serverless function, so it can gate access to the whole site — including
// plain HTML — with a single check. It only ever sees the httpOnly cookie
// header; it never has access to the access code itself (that only exists
// server-side, checked in /api/verify-access.js).

const COOKIE_NAME = 'site_session';

async function verifySiteSession(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(body));
    if (!valid) return null;
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  const isPublic =
    pathname.startsWith('/api/') ||
    pathname === '/login.html' ||
    pathname === '/setup.html' ||
    pathname === '/favicon.ico' ||
    /\.(css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|mp4|mp3)$/.test(pathname);

  if (isPublic) return;

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  const session = await verifySiteSession(token, process.env.SESSION_SECRET);

  if (!session || session.role !== 'site') {
    const url = new URL('/login.html', request.url);
    url.searchParams.set('next', pathname);
    return Response.redirect(url, 302);
  }
}

export const config = {
  matcher: '/((?!api/|login\\.html|setup\\.html).*)',
};

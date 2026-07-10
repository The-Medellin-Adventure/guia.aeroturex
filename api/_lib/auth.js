// Signed, httpOnly session tokens using HMAC-SHA256 (Web Crypto).
// No secret ever reaches the browser: the password/access-code checks happen
// here, server-side, and only a signed session token is stored in an
// httpOnly cookie that client-side JavaScript cannot read or copy.

import { webcrypto } from 'node:crypto';

const enc = new TextEncoder();

function toBase64Url(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

async function getKey(secret) {
  return webcrypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload, secret) {
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = await webcrypto.subtle.sign('HMAC', key, enc.encode(body));
  return `${body}.${toBase64Url(sig)}`;
}

export async function verifySession(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  try {
    const key = await getKey(secret);
    const expected = await webcrypto.subtle.sign('HMAC', key, enc.encode(body));
    if (toBase64Url(expected) !== sig) return null;
    const payload = JSON.parse(fromBase64Url(body).toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

export function appendSetCookie(res, cookieStr) {
  const existing = res.getHeader('Set-Cookie');
  let arr = [];
  if (Array.isArray(existing)) arr = existing.slice();
  else if (existing) arr = [existing];
  arr.push(cookieStr);
  res.setHeader('Set-Cookie', arr);
}

export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Validates the site access code (set by the admin from the "Acceso" tab,
// stored server-side in Vercel Blob) and issues a signed, httpOnly session
// cookie for visitors. Checked by middleware.js on every page request.

import { signSession, appendSetCookie, timingSafeEqualStr } from './_lib/auth.js';
import { readData } from './_lib/store.js';

const SESSION_DAYS = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  const data = await readData();
  const configuredCode = data && data.accessCode ? String(data.accessCode) : '';

  if (!configuredCode) {
    res.status(503).json({ error: 'no_access_code_configured' });
    return;
  }

  const { code } = req.body || {};

  if (!timingSafeEqualStr(String(code || ''), configuredCode)) {
    res.status(401).json({ error: 'wrong_code' });
    return;
  }

  const token = await signSession(
    { role: 'site', exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 },
    secret
  );

  appendSetCookie(
    res,
    `site_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  );

  res.status(200).json({ ok: true });
}

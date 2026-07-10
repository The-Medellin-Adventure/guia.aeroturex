// Validates the admin password server-side (against the ADMIN_PASSWORD
// environment variable) and issues a signed, httpOnly session cookie.
// The password itself never lives in any file that ships to the browser.

import { signSession, appendSetCookie, timingSafeEqualStr } from './_lib/auth.js';

const SESSION_HOURS = 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminPassword || !secret) {
    res.status(500).json({
      error: 'not_configured',
      hint: 'Set ADMIN_PASSWORD and SESSION_SECRET as environment variables in your Vercel project.',
    });
    return;
  }

  const { password } = req.body || {};

  if (!timingSafeEqualStr(String(password || ''), adminPassword)) {
    res.status(401).json({ error: 'wrong password' });
    return;
  }

  const token = await signSession(
    { role: 'admin', exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 },
    secret
  );

  appendSetCookie(
    res,
    `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 60 * 60}`
  );

  res.status(200).json({ ok: true });
}

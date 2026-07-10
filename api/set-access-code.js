// Admin-only. Patches just the accessCode field without touching the rest
// of the site's data — used by setup.html for the first-run bootstrap, and
// safe to call any time afterwards too.

import { verifySession, parseCookies } from './_lib/auth.js';
import { readData, writeData } from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie);
  const session = secret ? await verifySession(cookies.admin_session, secret) : null;

  if (!session || session.role !== 'admin') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const { code } = req.body || {};
  if (typeof code !== 'string') {
    res.status(400).json({ error: 'bad body' });
    return;
  }

  const current = (await readData()) || {};
  current.accessCode = code;
  await writeData(current);

  res.status(200).json({ ok: true });
}

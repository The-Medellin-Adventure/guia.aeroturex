// GET  -> public: returns the site's content. The accessCode field is
//         stripped unless the request carries a valid admin session cookie,
//         so it's never exposed in the browser's Network tab to regular
//         visitors (only to the admin, who set it in the first place).
// POST -> protected: requires a valid admin session cookie (set by
//         /api/admin-login). Saves the full data object to Vercel Blob.

import { verifySession, parseCookies } from './_lib/auth.js';
import { readData, writeData } from './_lib/store.js';

async function isAdmin(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const cookies = parseCookies(req.headers.cookie);
  const session = await verifySession(cookies.admin_session, secret);
  return !!session && session.role === 'admin';
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readData();
    const admin = await isAdmin(req);
    if (!data) {
      res.status(200).json({ data: null, isAdmin: admin });
      return;
    }
    const safe = { ...data };
    if (!admin) delete safe.accessCode;
    res.status(200).json({ data: safe, isAdmin: admin });
    return;
  }

  if (req.method === 'POST') {
    if (!(await isAdmin(req))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'bad body' });
      return;
    }
    try {
      await writeData(body);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'write_failed' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}

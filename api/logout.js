import { appendSetCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  appendSetCookie(res, 'admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  res.status(200).json({ ok: true });
}

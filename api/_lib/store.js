// Persists the site's JSON data (stops, vehicles, avatar, other tours, and
// the site access code) in Vercel Blob as PRIVATE storage. Private means the
// blob is never reachable by a public URL — only server code holding
// BLOB_READ_WRITE_TOKEN (auto-set by Vercel when you create a Blob store)
// can read or write it. This replaces localStorage, so all visitors now see
// the same, persisted content.

import { put, get } from '@vercel/blob';

const DATA_PATH = 'site-data.json';

export async function readData() {
  try {
    const res = await get(DATA_PATH, { access: 'private' });
    if (!res || !res.stream) return null;
    const chunks = [];
    for await (const chunk of res.stream) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(text);
  } catch (e) {
    return null; // not created yet, or store not configured
  }
}

export async function writeData(data) {
  await put(DATA_PATH, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

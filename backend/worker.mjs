import '../shared/progress-schema.js';
import '../shared/progress-merge.js';
const LIMIT = 2 * 1024 * 1024;
async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  const chunks = []; let size = 0;
  while (true) {
    const {value, done} = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > LIMIT) { await reader.cancel(); throw new Error('Progress record exceeds 2 MB. Download a backup.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let index = 0;
  for (const chunk of chunks) { bytes.set(chunk, index); index += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim());
    const headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
      'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type'};
    const reply = (status, data) => new Response(JSON.stringify(data), {status, headers});
    if (!origin || !allowed.includes(origin)) return reply(403, {error: 'Origin not allowed.'});
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    const match = new URL(request.url).pathname.match(/^\/v1\/progress\/(\d{4})$/);
    if (!match) return reply(404, {error: 'Unknown endpoint.'});
    if (!['GET', 'PUT'].includes(request.method)) return reply(405, {error: 'Method not allowed.'});
    const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) return reply(401, {error: 'A private learning key is required.'});
    try {
      if (env.RATE_LIMITER && !(await env.RATE_LIMITER.limit({key: request.headers.get('CF-Connecting-IP') || 'unknown'})).success)
        return reply(429, {error: 'Too many sync requests. Wait a minute and retry.'});
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${match[1]}:${token}`));
      const id = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
      const row = await env.DB.prepare('SELECT revision, data FROM progress WHERE id = ?').bind(id).first();
      if (request.method === 'GET') return reply(200, {revision: row?.revision || 0, data: row ? JSON.parse(row.data) : null});
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, {error: 'JSON is required.'});
      let body;
      try {
        body = await readBody(request);
        ProgressSchema.snapshot(body.data);
        if (!Number.isSafeInteger(body.revision) || body.revision < 0) throw new Error();
      } catch { return reply(400, {error: 'Invalid learning progress or request size. Local data has not been deleted.'}); }
      if (body.revision !== (row?.revision || 0)) return reply(409, {error: 'Another device saved first. Merge and retry.'});
      // Merge on the server as well. A stale client can never relock a tier.
      const data = row ? ProgressMerge.merge(JSON.parse(row.data), body.data) : body.data;
      const text = JSON.stringify(data);
      if (new TextEncoder().encode(text).byteLength > LIMIT) return reply(413, {error: 'Progress exceeds the cloud record limit. Download a backup.'});
      const revision = body.revision + 1;
      const saved = row
        ? await env.DB.prepare('UPDATE progress SET data = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ? RETURNING revision')
          .bind(text, revision, new Date().toISOString(), id, body.revision).first()
        : await env.DB.prepare('INSERT INTO progress (id, revision, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING revision')
          .bind(id, revision, text, new Date().toISOString()).first();
      if (!saved) return reply(409, {error: 'Another device saved first. Merge and retry.'});
      return reply(200, {revision, data});
    } catch { return reply(503, {error: 'Learning storage is unavailable. Keep practising locally and retry later.'}); }
  }
};

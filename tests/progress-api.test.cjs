const assert = require('node:assert/strict'), {DatabaseSync} = require('node:sqlite');
const fs = require('node:fs'), path = require('node:path'), {pathToFileURL} = require('node:url');
const {webcrypto} = require('node:crypto');
global.crypto ||= webcrypto;
require('../shared/progress-schema.js');
// Load schema before merge when this test is run on its own.
delete require.cache[require.resolve('../shared/progress-merge.js')];
const Model = require('../shared/progress-merge.js');
(async () => {
  const {default: worker} = await import(pathToFileURL(path.join(__dirname, '../backend/worker.mjs')));
  const sql = new DatabaseSync(':memory:'); sql.exec(fs.readFileSync(path.join(__dirname, '../backend/schema.sql'), 'utf8'));
  const env = {ALLOWED_ORIGINS: 'https://recovrsportsinc.github.io', DB: {prepare: query => ({bind: (...values) => ({first: async () => sql.prepare(query).get(...values) || null})})}};
  const token = 'a'.repeat(64), device = 'b'.repeat(32);
  async function request(method = 'GET', body = null, options = {}) {
    const headers = {Origin: env.ALLOWED_ORIGINS, Authorization: `Bearer ${token}`, ...options.headers};
    if (body) headers['Content-Type'] = 'application/json';
    return worker.fetch(new Request('https://example.test/v1/progress/1234', {method, headers, ...(body ? {body: JSON.stringify(body)} : {})}), env);
  }
  assert.equal((await request('OPTIONS')).status, 204);
  assert.equal((await request('GET', null, {headers: {Origin: 'https://evil.test'}})).status, 403);
  assert.equal((await request('GET', null, {headers: {Authorization: 'Bearer 1234'}})).status, 401);
  assert.deepEqual(await (await request()).json(), {revision: 0, data: null});
  const data = Model.empty(device), saved = await request('PUT', {revision: 0, data});
  assert.equal(saved.status, 200); assert.equal((await saved.json()).revision, 1);
  assert.equal((await request('PUT', {revision: 0, data})).status, 409);
  const races = await Promise.all([request('PUT', {revision: 1, data}), request('PUT', {revision: 1, data})]);
  assert.deepEqual(races.map(r => r.status).sort(), [200, 409], 'SQL compare-and-swap blocks lost updates');
  const isolated = await request('GET', null, {headers: {Authorization: `Bearer ${'c'.repeat(64)}`}});
  assert.equal((await isolated.json()).data, null);
  const current = await (await request()).json();
  const tiers = [0,1,2].map(() => ({best:0,passed:false,lessons:{words:false,sentences:false,mixed:false}}));
  data.roadmap.pairs['fr:en']={sports:tiers}; tiers[0].best=15; tiers[0].passed=true;
  assert.equal((await request('PUT', {revision:current.revision,data})).status, 200);
  const next = await (await request()).json();
  assert.equal((await request('PUT',{revision:next.revision,data:Model.empty(device)})).status,200);
  assert.equal((await (await request()).json()).data.roadmap.pairs['fr:en'].sports[0].passed,true,'Server also preserves completions');
  const malformed = JSON.parse('{"version":1,"roadmap":{"version":2,"pairs":{"__proto__":{}}}}');
  assert.equal((await request('PUT',{revision:4,data:malformed})).status,400);
  assert.equal((await request('PUT',{revision:4,data:{garbage:'x'.repeat(2100000)}})).status,400);
  assert.equal((await request()).headers.get('cache-control'),'no-store');
  const stored = sql.prepare('SELECT id FROM progress').get().id;
  assert(!stored.includes(token)); assert.notEqual(stored,token);
  env.RATE_LIMITER = {limit: async () => ({success: false})};
  assert.equal((await request()).status,429);
  sql.close();
  console.log('PASS: real SQLite storage, atomic concurrent writes, revision conflicts, private-key separation, CORS, server-side monotonic merge and payload limits.');
})().catch(error => {console.error(error);process.exitCode=1;});

const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const boot = fs.readFileSync(path.join(root, 'startup.js'), 'utf8');
function setup() {
  const nodes = Object.fromEntries(['startup-title', 'startup-message', 'startup-retry',
    'startup-panel', 'app-shell'].map(id => [id, { hidden: false, addEventListener() {} }]));
  const handlers = {}, timers = [];
  const context = vm.createContext({ window: { addEventListener: (name, fn) => handlers[name] = fn },
    document: { readyState: "complete", getElementById: id => nodes[id] }, location: {reload() {}},
    setTimeout: fn => timers.push(fn), clearTimeout() {} });
  vm.runInContext(boot, context);
  return { nodes, handlers, timers, api: context.window.appStartup, context };
}
const ready = setup();
ready.api.ready();
assert.equal(ready.nodes['app-shell'].hidden, false);
assert.equal(ready.nodes['startup-panel'].hidden, true);
ready.handlers.error({error: new Error('runtime after start')});
assert.equal(ready.nodes['app-shell'].hidden, false);
const blocked = setup(); blocked.api.blocked(); blocked.api.ready();
assert.equal(blocked.nodes['app-shell'].hidden, true);
assert.match(blocked.nodes['startup-title'].textContent, /another tab/);
assert.equal(blocked.nodes['startup-retry'].hidden, false);
const failed = setup(); failed.handlers.error({target: {tagName: 'SCRIPT'}}); failed.api.ready();
assert.equal(failed.nodes['app-shell'].hidden, true);
assert.match(failed.nodes['startup-message'].textContent, /not been deleted/);
const slow = setup(); slow.timers[0]();
assert.match(slow.nodes['startup-title'].textContent, /longer/);
slow.api.ready(); assert.equal(slow.nodes['app-shell'].hidden, false);
// Exercise the actual entry point with a denied lock and a damaged saved record.
async function entry(lock, damaged) {
  const env = setup(); let stateReads = 0;
  Object.assign(env.context, {navigator: {locks: {request: async (_key, _opts, fn) => fn(lock)}},
    APP_PREFIX: 'test', appState: {}, expandedBanksReady: Promise.resolve(),
    installExpandedContent() {}, setPracticeStatus() {}, setSyncStatus() {},
    loadPersistentState() { stateReads++; if (damaged) throw new Error('Saved progress is damaged.'); },
    saveLocally() {}, loadNextQuestion() {}, autoSyncToCloud() {}, syncProgress: async () => {},
    REFRESH_INTERVAL: 1000, setInterval() {}});
  env.context.document.querySelector = () => null;
  env.context.document.addEventListener = () => {};
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), env.context);
  await new Promise(setImmediate);
  for (let i = 0; i < 4; i++) {
    if (env.timers[i + 1]) env.timers[i + 1]();
    await new Promise(setImmediate);
  }
  return { ...env, stateReads };
}
(async () => {
  const locked = await entry(null, false);
  assert.equal(locked.stateReads, 0);
  assert.match(locked.nodes['startup-title'].textContent, /another tab/);
  const damaged = await entry({}, true);
  assert.match(damaged.nodes['startup-message'].textContent, /damaged/);
  assert.equal(damaged.nodes['app-shell'].hidden, true);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const release = html.match(/name="app-release" content="([^"]+)"/)[1];
  for (const match of html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)(?:\?[^" ]*)?)"/g)) {
    assert(match[1].endsWith(`?v=${release}`), match[1]);
  }
  assert.match(html, /id="app-shell" hidden/);
  console.log('PASS: visible tab-lock warning, damaged-state failure, script failure, slow loading, recovery and consistent release URLs.');
})().catch(error => { console.error(error); process.exitCode = 1; });

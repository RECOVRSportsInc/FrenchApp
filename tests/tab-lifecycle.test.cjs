const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
async function setup(outcomes, ready = 'complete') {
  const events = {}, timers = [], messages = [];
  let requests = 0, initialized = 0, reloads = 0;
  const state = {};
  const context = vm.createContext({
    APP_PREFIX: 'test', REFRESH_INTERVAL: 1000, appState: state,
    navigator: { locks: { request: async (_name, _options, callback) => {
      requests++;
      const outcome = outcomes.shift();
      if (outcome instanceof Error) throw outcome;
      return callback(outcome);
    }}},
    window: {addEventListener: (name, fn) => (events[name] ||= []).push(fn),
      appStartup: {ready() {}, blocked: () => messages.push('blocked'), fail: text => messages.push(text)}},
    document: {readyState: ready, querySelector: () => null, addEventListener() {}},
    expandedBanksReady: Promise.resolve(), installExpandedContent() {},
    setPracticeStatus() {}, setSyncStatus() {},
    loadPersistentState: () => initialized++, saveLocally() {}, loadNextQuestion() {},
    autoSyncToCloud() {}, syncProgress: async () => {}, setInterval() {},
    setTimeout: fn => timers.push(fn), location: {reload: () => reloads++}
  });
  vm.runInContext(source, context);
  const flush = () => new Promise(setImmediate);
  await flush();
  return {state, messages, timers, flush,
    emit: (name, value = {}) => {for (const fn of events[name] || []) fn(value);},
    counts: () => ({requests, initialized, reloads})};
}
(async () => {
  const transient = await setup([new Error('Promise was rejected because the browsing context is going away'), {}]);
  assert.equal(transient.counts().initialized, 0);
  transient.timers.shift()(); await transient.flush();
  assert.equal(transient.counts().initialized, 1);
  assert.equal(transient.state.tabActive, true);
  assert.deepEqual(transient.messages, []);
  const held = await setup([null, {}]);
  held.timers.shift()(); await held.flush();
  assert.equal(held.counts().initialized, 1);
  const loading = await setup([{}], 'loading');
  assert.equal(loading.counts().requests, 0);
  loading.emit('load'); loading.emit('load'); await loading.flush();
  assert.equal(loading.counts().initialized, 1);
  loading.emit('pagehide'); await loading.flush();
  assert.equal(loading.state.tabActive, false);
  loading.emit('pageshow', {persisted: true});
  assert.equal(loading.counts().reloads, 1);
  const leaving = await setup([new Error('browsing context is going away')]);
  leaving.emit('pagehide'); leaving.timers.shift()(); await leaving.flush();
  assert.equal(leaving.counts().requests, 1);
  assert.deepEqual(leaving.messages, []);
  const permanent = await setup([new Error('Lock permission denied')]);
  assert.equal(permanent.timers.length, 0);
  assert.deepEqual(permanent.messages, ['Lock permission denied']);
  const exhausted = await setup(Array.from({length: 5}, () => new Error('Context is invalid')));
  for(let i=0;i<4;i++){exhausted.timers.shift()();await exhausted.flush();}
  assert.equal(exhausted.counts().requests, 5);
  assert.equal(exhausted.counts().initialized, 0);
  assert.equal(exhausted.messages.length, 1);
  console.log('PASS: Safari context retry, refresh lock release, load timing, single initialization, restored pages and bounded failures.');
})().catch(error => {console.error(error);process.exitCode=1;});

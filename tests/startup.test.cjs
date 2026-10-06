const fs = require('node:fs'), path = require('node:path');
const vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function setup() {
  const events = [];
  let resolve, reject;
  const ready = new Promise((yes, no) => { resolve = yes; reject = no; });
  const state = { tabActive: false };
  const context = vm.createContext({
    navigator: {}, console, appState: state, expandedBanksReady: ready,
    installExpandedContent: () => events.push('install'),
    setPracticeStatus: text => events.push(['practice', text]),
    setSyncStatus: text => events.push(['sync', text]),
    loadPersistentState: () => events.push('state'),
    saveLocally: () => events.push('save'),
    loadNextQuestion: () => events.push('question'),
    autoSyncToCloud() {}, syncProgress: async () => events.push('cloud'),
    REFRESH_INTERVAL: 1000, setInterval() {},
    document: { querySelector: () => null, addEventListener() {} },
    window: { addEventListener() {} }
  });
  vm.runInContext(source, context);
  return { events, resolve, reject, state };
}
(async () => {
  const success = setup();
  assert(!success.events.includes('question'));
  assert(!success.events.includes('state'));
  success.resolve();
  await new Promise(setImmediate);
  assert.deepEqual(success.events.filter(event => typeof event === 'string'),
    ['install', 'state', 'save', 'question', 'cloud']);
  const failure = setup();
  failure.reject(new Error('The practice bank could not be loaded.'));
  await new Promise(setImmediate);
  assert(!failure.events.includes('question'));
  assert(failure.events.some(event => event[0] === 'practice' && event[1].includes('could not be loaded')));
  assert(failure.events.some(event => event[0] === 'sync' && event[1].includes('could not be loaded')));
  console.log('PASS: startup waits for the bank and reports failures without starting a partial quiz.');
})().catch(error => { console.error(error); process.exitCode = 1; });

const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const assert = require('node:assert/strict'), {webcrypto} = require('node:crypto');
const S = require('../shared/progress-schema.js'), M = require('../shared/progress-merge.js');
const files = ['daily/activity-store.js'];
function setup() {
  const disk = new Map(); let renders = 0;
  const context = vm.createContext({crypto: webcrypto, ProgressSchema: S, ProgressMerge: M, structuredClone,
    APP_PREFIX: 'test', appState: {syncCode: '1234', tabActive: true}, learningLanguage: 'fr', answerLanguage: 'en',
    localStorage: {getItem: key => disk.get(key) || null, setItem: (key, value) => disk.set(key, value)},
    renderToday: () => renders++, scheduleLearningSync() {}});
  for(const file of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return {disk, context, run: source => vm.runInContext(source, context), renders: () => renders};
}
const env = setup();
env.run('recordDailyVisit(); recordDailyVisit()');
assert.equal(env.run('dailySummary().visited'), 1);
assert.equal(env.run('dailySummary().streak'), 0);
const id = 'a'.repeat(32);
assert.equal(env.run(`recordLearningCompletion('${id}', 'lesson', 8, 3, '1234')`), true);
assert.equal(env.run(`recordLearningCompletion('${id}', 'lesson', 8, 3, '1234')`), false);
assert.equal(env.run('dailySummary().sessions'), 1); assert.equal(env.run('dailySummary().streak'), 1);
env.run("appState.syncCode='5678'"); assert.equal(env.run('dailySummary().sessions'), 0);
assert.equal(env.run(`recordLearningCompletion('${id}', 'lesson', 8, 8, '1234')`), false);
env.run("appState.syncCode='1234'; appState.tabActive=false");
assert.equal(env.run(`recordLearningCompletion('${'b'.repeat(32)}', 'round', 10, 8, '1234')`), false);
env.run("appState.tabActive=true; const store=readDailyStore(); store.data.days={}");
function session(day, letter) {
  env.run(`readDailyStore().data.days['${day}']={visits:{},sessions:{'${letter.repeat(32)}':{kind:'round',answers:10,correct:7,pair:'fr:en',at:'${day}T20:00:00Z',goal:1}}}`);
}
session('2026-10-15', 'a'); session('2026-10-16', 'b');
assert.equal(env.run("dailySummary('2026-10-17').streak"), 2, 'Streak remains available until today ends');
assert.equal(env.run("dailySummary('2026-10-18').streak"), 0, 'A missed day ends the current streak');
assert.equal(env.run("dailySummary('2026-10-18').best"), 2);
assert.equal(env.run("previousLearningDay('2026-03-09')"), '2026-03-08');
assert.equal(env.run("previousLearningDay('2026-11-02')"), '2026-11-01');
assert.equal(env.run("previousLearningDay('2026-01-01')"), '2025-12-31');
assert.equal(env.run("learningDay(new Date(2026, 9, 17, 23, 59))"), '2026-10-17');
assert.equal(env.run("learningDay(new Date(2026, 9, 18, 0, 1))"), '2026-10-18');
env.disk.set('test_daily_v1_9999', '{broken');
env.run("appState.syncCode='9999'"); assert.equal(env.run('readDailyStore().blocked'), true);
assert.equal(env.run(`recordLearningCompletion('${id}','round',10,8,'9999')`), false);
assert.equal(env.disk.get('test_daily_v1_9999'), '{broken');
assert.equal(env.run('getDailyBackup().unreadableOriginal'), '{broken');
console.log('PASS: visits versus streaks, duplicate completions, learner isolation, failed-session credit, midnight/DST/year boundaries and damaged activity preservation.');

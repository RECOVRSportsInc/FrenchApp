const dailyCache = new Map();
function learningSessionId() { return crypto.randomUUID(); }
function learningDeviceId() {
  const key = `${APP_PREFIX}_learning_device`;
  let id = localStorage.getItem(key);
  if (!/^[a-f0-9]{32}$/.test(id || '')) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(key, id);
  }
  return id;
}
function dailyStoreKey(code = appState.syncCode) { return `${APP_PREFIX}_daily_v1_${code}`; }
function learningDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function previousLearningDay(day) {
  const date = new Date(day + 'T12:00:00'); date.setDate(date.getDate() - 1); return learningDay(date);
}
function readDailyStore(code = appState.syncCode) {
  if (dailyCache.has(code)) return dailyCache.get(code);
  const store = {data: null, raw: null, blocked: false, error: ''};
  try {
    store.raw = localStorage.getItem(dailyStoreKey(code));
    store.data = store.raw ? ProgressSchema.activity(JSON.parse(store.raw)) : ProgressMerge.empty(learningDeviceId()).activity;
  } catch {
    store.blocked = true;
    store.error = 'Daily activity could not be read or saved. Download a backup before changing browser storage.';
  }
  dailyCache.set(code, store); return store;
}
function persistDailyStore(store = readDailyStore(), code = appState.syncCode) {
  if (store.blocked) return false;
  try { localStorage.setItem(dailyStoreKey(code), JSON.stringify(store.data)); store.error = ''; return true; }
  catch { store.error = 'New activity is only held in this open page. Download a backup before closing it.'; return false; }
}
function recordDailyVisit() {
  if (!appState.tabActive || appState.switchingCode) return;
  const store = readDailyStore(); if (store.blocked) return;
  const day = store.data.days[learningDay()] ||= {visits: {}, sessions: {}};
  try { day.visits[learningDeviceId()] = true; persistDailyStore(store); } catch { store.error = 'Device storage is unavailable.'; }
}
function recordLearningCompletion(id, kind, answers, correct, owner, pair = `${learningLanguage}:${answerLanguage}`) {
  if (!appState.tabActive || appState.switchingCode || owner !== appState.syncCode || !id || !answers) return false;
  const store = readDailyStore(); if (store.blocked) return false;
  for (const day of Object.values(store.data.days)) if (Object.hasOwn(day.sessions, id)) return false;
  const day = store.data.days[learningDay()] ||= {visits: {}, sessions: {}};
  day.sessions[id] = {kind, answers, correct, pair, at: new Date().toISOString(), goal: store.data.setting.goal};
  persistDailyStore(store);
  if (typeof renderToday === 'function') renderToday();
  if (typeof scheduleLearningSync === 'function') scheduleLearningSync();
  return true;
}
function setDailyGoal(goal) {
  if (!appState.tabActive || appState.switchingCode || ![1, 2, 3].includes(goal)) return;
  const store = readDailyStore(); if (store.blocked) return;
  try { store.data.setting = {goal, at: new Date().toISOString(), device: learningDeviceId()}; }
  catch { store.error = 'Device storage is unavailable.'; return; }
  persistDailyStore(store); renderToday(); scheduleLearningSync();
}
function dailySummary(day = learningDay()) {
  const store = readDailyStore(); if (!store.data) return {sessions: 0, streak: 0, best: 0, goal: 1, active: 0, visited: 0};
  const days = store.data.days, active = Object.keys(days).filter(key => Object.keys(days[key].sessions).length && key <= day).sort();
  let run = 0, best = 0, last = null;
  for (const key of active) { run = last === previousLearningDay(key) ? run + 1 : 1; best = Math.max(best, run); last = key; }
  let streak = 0, cursor = Object.keys(days[day]?.sessions || {}).length ? day : previousLearningDay(day);
  while (Object.keys(days[cursor]?.sessions || {}).length) { streak++; cursor = previousLearningDay(cursor); }
  return {sessions: Object.keys(days[day]?.sessions || {}).length, streak, best, active: active.length,
    visited: Object.keys(days).filter(key => key <= day && Object.keys(days[key].visits).length).length, goal: store.data.setting.goal};
}
function getDailyBackup() {
  const store = readDailyStore();
  return {data: store.data, storageError: store.error || null, unreadableOriginal: store.blocked ? store.raw : null};
}
function learningHistoryIncrement(row, correct) {
  try { return ProgressMerge.increment(row, correct, learningDeviceId()); }
  catch { throw new Error('Word history cannot be safely updated. Download a backup.'); }
}

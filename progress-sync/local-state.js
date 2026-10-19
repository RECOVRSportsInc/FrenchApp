function learningSnapshot(code = appState.syncCode) {
  const roadmap = readRoadmapStore(code), history = readWordHistory(code), daily = readDailyStore(code);
  if (roadmap.blocked || history.blocked || daily.blocked || roadmap.error || history.error || daily.error)
    throw new Error('A progress record needs attention. Download a backup before syncing.');
  return ProgressSchema.snapshot({version: 1, roadmap: structuredClone(roadmap.data),
    history: structuredClone(history.data), activity: structuredClone(daily.data)});
}
function learningJournalKey(code) { return `${APP_PREFIX}_learning_import_${code}`; }
function restoreLearningJournal(code = appState.syncCode) {
  const raw = localStorage.getItem(learningJournalKey(code));
  if (!raw) return;
  // Leave invalid recovery data untouched and stop before any other writes.
  let data;
  try { data = ProgressSchema.snapshot(JSON.parse(raw)); }
  catch { throw new Error('Learning sync recovery data is damaged. Download a backup before continuing.'); }
  installLearningSnapshot(ProgressMerge.merge(data, learningSnapshot(code)), code);
}
function installLearningSnapshot(data, code) {
  ProgressSchema.snapshot(data);
  localStorage.setItem(learningJournalKey(code), JSON.stringify(data));
  localStorage.setItem(roadmapStoreKey(code), JSON.stringify(data.roadmap));
  localStorage.setItem(wordHistoryKey(code), JSON.stringify(data.history));
  localStorage.setItem(dailyStoreKey(code), JSON.stringify(data.activity));
  roadmapStoreCache.delete(code); wordHistoryCache.delete(code); dailyCache.delete(code);
  localStorage.removeItem(learningJournalKey(code));
}
function learningKeyStorage(code = appState.syncCode) { return `${APP_PREFIX}_learning_key_${code}`; }
function getLearningKey(code = appState.syncCode) {
  const value = localStorage.getItem(learningKeyStorage(code));
  if (value && !/^[a-f0-9]{64}$/.test(value)) throw new Error('The saved learning key is invalid.');
  return value;
}
function createLearningKey() {
  if (!appState.tabActive || appState.switchingCode) return;
  let key = getLearningKey();
  if (!key) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(learningKeyStorage(), key);
  }
  return key;
}
function learningSyncEndpoint() {
  const raw = window.learningSyncConfig?.endpoint || '';
  if (!raw) return '';
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Learning sync requires HTTPS.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Invalid learning sync address.');
  return url.href.replace(/\/$/, '');
}

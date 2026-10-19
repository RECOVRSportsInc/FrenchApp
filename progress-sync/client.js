const learningSyncState = {task: null, timer: null, status: 'Learning progress is saved on this device.', lastScope: '', retryAt: 0, failures: 0};
function setLearningSyncStatus(text) {
  learningSyncState.status = text;
  const element = document.getElementById('learning-sync-status'); if (element) element.textContent = text;
}
async function learningRequest(endpoint, code, key, method = 'GET', body = null) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${endpoint}/v1/progress/${code}`, {method, cache: 'no-store', signal: controller.signal,
      headers: {Authorization: `Bearer ${key}`, ...(body ? {'Content-Type': 'application/json'} : {})},
      ...(body ? {body: JSON.stringify(body)} : {})});
    const result = await response.json();
    if (!response.ok) { const error = new Error(result.error || `Learning sync HTTP ${response.status}.`); error.status = response.status; throw error; }
    if (!Number.isSafeInteger(result.revision) || result.revision < 0) throw new Error('Invalid cloud revision.');
    if (result.data !== null) ProgressSchema.snapshot(result.data);
    return result;
  } finally { clearTimeout(timer); }
}
function learningScopeCurrent(code, key) {
  return appState.tabActive && !appState.switchingCode && appState.syncCode === code && getLearningKey(code) === key;
}
async function performLearningSync() {
  if (!appState.tabActive || appState.switchingCode || navigator.onLine === false) return;
  const code = appState.syncCode, key = getLearningKey(code), endpoint = learningSyncEndpoint();
  if (!endpoint) { setLearningSyncStatus('Learning progress is local. Cloud setup has not been activated.'); return; }
  if (!key) { setLearningSyncStatus('Connect a learning key to sync roadmap, history and daily activity.'); return; }
  setLearningSyncStatus('Syncing learning progress…');
  restoreLearningJournal(code);
  for (let attempt = 0; attempt < 4; attempt++) {
    const remote = await learningRequest(endpoint, code, key);
    if (!learningScopeCurrent(code, key)) return;
    const current = learningSnapshot(code);
    const merged = remote.data ? ProgressMerge.merge(current, remote.data) : current;
    let saved;
    try { saved = remote.data && JSON.stringify(remote.data) === JSON.stringify(merged)
      ? remote : await learningRequest(endpoint, code, key, 'PUT', {revision: remote.revision, data: merged}); }
    catch (error) { if (error.status === 409) continue; throw error; }
    if (!learningScopeCurrent(code, key)) return;
    // Answers completed while the network was busy must survive the response.
    installLearningSnapshot(ProgressMerge.merge(learningSnapshot(code), saved.data), code);
    learningSyncState.failures = 0; learningSyncState.retryAt = 0;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    setLearningSyncStatus(`Learning progress synced at ${now}. XP uses the separate XP service.`);
    renderWordProgress(); renderToday(); return;
  }
  throw new Error('Another device is syncing. Your progress is safe locally; try again shortly.');
}
function syncLearningProgress() {
  if (learningSyncState.task) return learningSyncState.task;
  const owner = appState.syncCode;
  learningSyncState.task = performLearningSync().catch(error => {
    if (appState.syncCode !== owner) return;
    learningSyncState.failures++;
    learningSyncState.retryAt = Date.now() + Math.min(120000, 5000 * 2 ** Math.min(learningSyncState.failures, 4));
    setLearningSyncStatus(`Learning sync paused: ${error.message} Local progress is retained.`);
  }).finally(() => { learningSyncState.task = null; });
  return learningSyncState.task;
}
function scheduleLearningSync() {
  clearTimeout(learningSyncState.timer);
  learningSyncState.timer = setTimeout(() => {
    if (Date.now() >= learningSyncState.retryAt) syncLearningProgress();
  }, 1000);
}

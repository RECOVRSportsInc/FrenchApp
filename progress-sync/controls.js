function initLearningSyncControls() {
  document.getElementById('learning-sync-panel').innerHTML = `<h2>Learning progress across devices</h2><p id="learning-sync-status" role="status" aria-live="polite"></p><p>The 4-digit code still connects XP. A separate private learning key connects roadmap progress, word history and daily activity.</p>
    <div class="today-actions"><button id="learning-connect" type="button">Create learning key</button><button id="learning-sync" type="button">Sync learning progress</button><button id="learning-backup" type="button">Download backup</button></div>
    <details><summary>Connect another device</summary><p>Use the same 4-digit XP code first. Transfer the learning key privately; anyone holding it can access this learning record. Keep it out of screenshots and messages.</p><label for="learning-key">Private learning key</label><input id="learning-key" type="password" autocomplete="off" spellcheck="false"><button id="learning-use-key" type="button">Connect this key</button><button id="learning-show-key" type="button">Show my key</button><p id="learning-key-note" role="status"></p></details>`;
  document.getElementById('learning-backup').onclick = exportProgress;
  document.getElementById('learning-connect').onclick = () => {
    try { createLearningKey(); setLearningSyncStatus('Learning key created. Store a private copy to connect another device.'); renderLearningSyncControls(); scheduleLearningSync(); }
    catch (error) { setLearningSyncStatus(error.message); }
  };
  document.getElementById('learning-sync').onclick = syncLearningProgress;
  document.getElementById('learning-show-key').onclick = () => {
    try {
      const input = document.getElementById('learning-key'); input.value = getLearningKey() || '';
      input.type = input.type === 'password' ? 'text' : 'password';
      document.getElementById('learning-show-key').textContent = input.type === 'text' ? 'Hide my key' : 'Show my key';
    } catch (error) { setLearningSyncStatus(error.message); }
  };
  document.getElementById('learning-use-key').onclick = async () => {
    if (!appState.tabActive || appState.switchingCode || learningSyncState.task) return;
    const code = appState.syncCode, candidate = document.getElementById('learning-key').value.trim();
    if (!/^[a-f0-9]{64}$/.test(candidate)) { setLearningSyncStatus('Enter the complete 64-character learning key.'); return; }
    try {
      const endpoint = learningSyncEndpoint(); if (!endpoint) throw new Error('Cloud setup has not been activated.');
      const remote = await learningRequest(endpoint, code, candidate);
      if (!remote.data) throw new Error('No learning record matches this key and XP code. Sync the first device first.');
      if (code !== appState.syncCode || !appState.tabActive || appState.switchingCode) return;
      if (getLearningKey() && getLearningKey() !== candidate && !confirm('Connect a different learning key? Current local progress will be merged into that record. Download a backup first.')) return;
      localStorage.setItem(learningKeyStorage(code), candidate);
      document.getElementById('learning-key').value = ''; document.getElementById('learning-key').type = 'password';
      learningSyncState.retryAt = 0; await syncLearningProgress();
    } catch (error) { setLearningSyncStatus(error.message); }
  };
}
function renderLearningSyncControls() {
  const status = document.getElementById('learning-sync-status'); if (!status) return;
  const scope = appState.syncCode;
  if (learningSyncState.lastScope !== scope) {
    learningSyncState.lastScope = scope;
    document.getElementById('learning-key').value = ''; document.getElementById('learning-key').type = 'password';
    learningSyncState.retryAt = 0;
    setLearningSyncStatus('Learning progress is saved on this device.'); scheduleLearningSync();
  }
  try {
    const connected = Boolean(getLearningKey()), enabled = Boolean(learningSyncEndpoint());
    document.getElementById('learning-connect').disabled = connected || !enabled;
    document.getElementById('learning-sync').disabled = !enabled || !connected;
    document.getElementById('learning-use-key').disabled = !enabled;
    document.getElementById('learning-connect').textContent = connected ? 'Learning key connected' : 'Create learning key';
    status.textContent = enabled ? learningSyncState.status : 'Learning progress is local. Cloud setup has not been activated.';
  } catch (error) { status.textContent = error.message; }
}

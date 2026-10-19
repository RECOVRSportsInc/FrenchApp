function downloadLearningBackup() {
  let recovery = null;
  try { recovery = localStorage.getItem(learningJournalKey(appState.syncCode)); } catch { /* Preserve available in-memory records below. */ }
  const backup = {version: 3, code: appState.syncCode, xp: appState.xp, pendingXP: appState.pendingXP,
    writeIntent: appState.writeIntent, wordProgress: getWordProgressBackup(), roadmapProgress: getRoadmapBackup(),
    dailyActivity: getDailyBackup(), learningSyncRecovery: recovery, exportedAt: new Date().toISOString()};
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `language-progress-${appState.syncCode}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

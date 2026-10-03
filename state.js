const APP_PREFIX = "frenchfasttrack_v2";
const API_BASE = "https://countapi.mileshilliard.com/api/v1";
const REFRESH_INTERVAL = 20000;
const appState = {
  currentWord: {}, previousWord: "", syncTask: null, switchingCode: false,
  uploadInProgress: false, nextQuestionTimer: null, xp: 0, pendingXP: 0,
  syncCode: "", writeIntent: null, storageAvailable: true, retryAfter: 0,
  failures: 0
};
function validXP(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}
function storageGet(key) {
  try { return localStorage.getItem(key); }
  catch { appState.storageAvailable = false; return null; }
}
function recordKey(code = appState.syncCode) { return `${APP_PREFIX}_record_${code}`; }
function generateSyncCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(1000 + bytes[0] % 9000);
}
function pendingStorageKey() { return `${APP_PREFIX}_pending_${appState.syncCode}`; }
function readPendingXP() {
  const n = Number(storageGet(pendingStorageKey()));
  return Number.isSafeInteger(n) ? n : 0;
}
function readRecord(code) {
  const raw = storageGet(recordKey(code));
  if (!raw) return null;
  let r;
  try { r = JSON.parse(raw); } catch { throw new Error("The saved progress record is damaged. Export a backup before continuing."); }
  if (!r || !Number.isSafeInteger(r.xp) || r.xp < 0 || !Number.isSafeInteger(r.pendingXP))
    throw new Error("The saved progress record is invalid.");
  if (r.writeIntent && (!Number.isSafeInteger(r.writeIntent.target) || r.writeIntent.target < 0 ||
      !Number.isSafeInteger(r.writeIntent.delta))) throw new Error("The interrupted save record is invalid.");
  return r;
}
function loadPersistentState() {
  const code = storageGet("frenchSyncCode");
  appState.syncCode = /^\d{4}$/.test(code || "") ? code : generateSyncCode();
  const r = readRecord(appState.syncCode);
  appState.xp = r ? r.xp : validXP(storageGet("frenchXP"));
  appState.pendingXP = r ? r.pendingXP : readPendingXP();
  appState.writeIntent = r ? r.writeIntent || null : null;
}
function saveLocally() {
  try {
    // One authoritative write keeps XP, pending changes and recovery data together.
    localStorage.setItem(recordKey(), JSON.stringify({xp: appState.xp,
      pendingXP: appState.pendingXP, writeIntent: appState.writeIntent}));
    localStorage.setItem("frenchSyncCode", appState.syncCode);
  } catch { appState.storageAvailable = false; }
  const xp = document.getElementById("xp");
  const code = document.getElementById("sync-code-display");
  if (xp) xp.textContent = appState.xp;
  if (code) code.textContent = appState.syncCode;
  if (!appState.storageAvailable && typeof setSyncStatus === "function")
    setSyncStatus("Device storage is unavailable. Keep this page open and export a backup.");
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({version: 1, code: appState.syncCode,
    xp: appState.xp, pendingXP: appState.pendingXP, writeIntent: appState.writeIntent,
    exportedAt: new Date().toISOString()}, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `french-progress-${appState.syncCode}.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const APP_PREFIX = "frenchfasttrack_v2";
const API_BASE = "https://countapi.mileshilliard.com/api/v1";
const REFRESH_INTERVAL = 20000;

const appState = {
  currentWord: {},
  previousWord: "",
  syncTask: null,
  switchingCode: false,
  uploadInProgress: false,
  nextQuestionTimer: null,
  xp: 0,
  pendingXP: 0,
  syncCode: ""
};

function validXP(value) {
  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0
    ? number
    : 0;
}

function generateSyncCode() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  localStorage.setItem("frenchSyncCode", code);
  return code;
}

function pendingStorageKey() {
  return `${APP_PREFIX}_pending_${appState.syncCode}`;
}

function readPendingXP() {
  const value = Number(localStorage.getItem(pendingStorageKey()));

  return Number.isSafeInteger(value) ? value : 0;
}

function loadPersistentState() {
  appState.xp = validXP(localStorage.getItem("frenchXP"));

  let syncCode = localStorage.getItem("frenchSyncCode");

  if (!/^\d{4}$/.test(syncCode || "")) {
    syncCode = generateSyncCode();
  }

  appState.syncCode = syncCode;
  appState.pendingXP = readPendingXP();
}

function saveLocally() {
  localStorage.setItem("frenchXP", String(appState.xp));
  localStorage.setItem("frenchSyncCode", appState.syncCode);
  localStorage.setItem(pendingStorageKey(), String(appState.pendingXP));

  const xpValue = document.getElementById("xp");
  const syncCodeDisplay = document.getElementById("sync-code-display");

  if (xpValue) {
    xpValue.textContent = appState.xp;
  }

  if (syncCodeDisplay) {
    syncCodeDisplay.textContent = appState.syncCode;
  }
}

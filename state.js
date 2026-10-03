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
  syncCode: "",
  writeIntent: null,
  storageAvailable: true,
  retryAfter: 0,
  failures: 0
};

function validXP(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    appState.storageAvailable = false;
    return null;
  }
}

function recordKey(code = appState.syncCode) {
  return `${APP_PREFIX}_record_${code}`;
}

function generateSyncCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);

  return String(1000 + bytes[0] % 9000);
}

function pendingStorageKey() {
  return `${APP_PREFIX}_pending_${appState.syncCode}`;
}

function readPendingXP() {
  const n = Number(storageGet(pendingStorageKey()));
  return Number.isSafeInteger(n) ? n : 0;
}

function readRecord(code) {
  const raw = storageGet(recordKey(code));
  if (!raw) return null;

  let record;

  try {
    record = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved progress record is damaged. " +
      "Export a backup before continuing."
    );
  }

  if (
    !record ||
    !Number.isSafeInteger(record.xp) ||
    record.xp < 0 ||
    !Number.isSafeInteger(record.pendingXP)
  ) {
    throw new Error("The saved progress record is invalid.");
  }

  if (
    record.writeIntent &&
    (
      !Number.isSafeInteger(record.writeIntent.target) ||
      record.writeIntent.target < 0 ||
      !Number.isSafeInteger(record.writeIntent.delta)
    )
  ) {
    throw new Error("The interrupted save record is invalid.");
  }

  return record;
}

function loadPersistentState() {
  const code = storageGet("frenchSyncCode");

  appState.syncCode = /^\d{4}$/.test(code || "")
    ? code
    : generateSyncCode();

  const record = readRecord(appState.syncCode);

  appState.xp = record
    ? record.xp
    : validXP(storageGet("frenchXP"));

  appState.pendingXP = record
    ? record.pendingXP
    : readPendingXP();

  appState.writeIntent = record
    ? record.writeIntent || null
    : null;
}

function saveLocally() {
  try {
    localStorage.setItem(
      recordKey(),
      JSON.stringify({
        xp: appState.xp,
        pendingXP: appState.pendingXP,
        writeIntent: appState.writeIntent
      })
    );

    localStorage.setItem("frenchSyncCode", appState.syncCode);
  } catch {
    appState.storageAvailable = false;
  }

  const xp = document.getElementById("xp");
  const code = document.getElementById("sync-code-display");

  if (xp) xp.textContent = appState.xp;
  if (code) code.textContent = appState.syncCode;

  if (typeof renderWordProgress === "function") {
    renderWordProgress();
  }

  if (
    !appState.storageAvailable &&
    typeof setSyncStatus === "function"
  ) {
    setSyncStatus(
      "Device storage is unavailable. " +
      "Keep this page open and export a backup."
    );
  }
}

function exportProgress() {
  const backup = {
    version: 2,
    code: appState.syncCode,
    xp: appState.xp,
    pendingXP: appState.pendingXP,
    writeIntent: appState.writeIntent,
    wordProgress: typeof getWordProgressBackup === "function"
      ? getWordProgressBackup()
      : null,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `language-progress-${appState.syncCode}.json`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
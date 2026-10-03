function setSyncStatus(message) {
  const statusElement = document.getElementById("sync-status");

  if (statusElement) {
    statusElement.textContent = message;
  }
}

async function requestCloud(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    const body = await response.text();
    let data;

    try {
      data = JSON.parse(body);
    } catch {
      const error = new Error(`HTTP ${response.status}: the server returned a non-JSON response.`);
      error.status = response.status;
      throw error;
    }

    if (!response.ok || data.error) {
      const error = new Error(
        `HTTP ${response.status}: ` +
        (data.error || data.message || "Cloud request failed.")
      );

      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The cloud service did not respond within 15 seconds."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCloudXP(value) {
  if (
    value === undefined ||
    value === null ||
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    throw new Error("The cloud service returned an invalid XP value.");
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error("The cloud service returned an invalid XP value.");
  }

  return number;
}

async function getCloudXP(code) {
  const key = encodeURIComponent(`${APP_PREFIX}_${code}`);
  const data = await requestCloud(`${API_BASE}/get/${key}`);

  return parseCloudXP(data.value);
}

async function saveToCloud(code, value) {
  const key = encodeURIComponent(`${APP_PREFIX}_${code}`);
  const data = await requestCloud(
    `${API_BASE}/set/${key}?value=${value}`
  );

  if (parseCloudXP(data.value) !== value) {
    throw new Error(
      "The server did not confirm the expected XP value."
    );
  }
}

async function performSync() {
  if (!appState.tabActive) return;
  if (!appState.storageAvailable) throw new Error("Device storage is unavailable; export a backup first.");
  setSyncStatus("Syncing…");
  const code = appState.syncCode;
  let cloudXP;
  let missing = false;
  try { cloudXP = await getCloudXP(code); }
  catch (error) { if (error.status !== 404) throw error; missing = true; }
  // Never blindly repeat a write after a timeout or reload.
  if (appState.writeIntent) {
    const intent = appState.writeIntent;
    if (missing || cloudXP !== intent.target) {
      throw new Error("An interrupted save needs checking. Export a backup. Automatic writes are paused to avoid counting XP twice.");
    }
    appState.pendingXP -= intent.delta;
    appState.writeIntent = null;
    appState.xp = Math.max(0, cloudXP + appState.pendingXP);
    saveLocally();
  }
  const delta = appState.pendingXP;
  const target = missing ? appState.xp : Math.max(0, cloudXP + delta);
  if (!Number.isSafeInteger(target)) throw new Error("XP exceeds the supported limit.");
  if (missing || delta !== 0) {
    appState.writeIntent = {target, delta};
    saveLocally();
    if (!appState.storageAvailable) throw new Error("Unable to save recovery data on this device.");
    await saveToCloud(code, target);
    appState.pendingXP -= delta;
    appState.writeIntent = null;
  }
  appState.xp = Math.max(0, target + appState.pendingXP);
  saveLocally();
  appState.failures = 0;
  appState.retryAfter = 0;
  setSyncStatus(appState.pendingXP ? "Progress saved on this device. Sync pending." : "Progress synced");
}

function syncProgress() {
  if (appState.syncTask) {
    return appState.syncTask;
  }

  appState.syncTask = performSync()
    .catch(error => {
      appState.failures++;
      appState.retryAfter = Date.now() + Math.min(120000, 5000 * 2 ** Math.min(appState.failures, 5));
      setSyncStatus(appState.storageAvailable ? `Sync paused: ${error.message} Progress is saved on this device.` : "Device storage unavailable. Export a backup.");
      throw error;
    })
    .finally(() => {
      appState.syncTask = null;
    });

  return appState.syncTask;
}

async function autoSyncToCloud() {
  if (!appState.tabActive || appState.switchingCode || navigator.onLine === false || Date.now() < appState.retryAfter) {
    return;
  }

  try {
    await syncProgress();
  } catch (error) {
    console.warn("Automatic sync failed:", error.message);
  }
}

async function uploadProgress() {
  if (!appState.tabActive || appState.uploadInProgress || appState.switchingCode) {
    return;
  }

  appState.uploadInProgress = true;

  try {
    await syncProgress();

    alert(`Progress synced: ${appState.xp} XP under code ${appState.syncCode}`);
  } catch (error) {
    console.error("Cloud save failed:", error);

    alert(
      `Cloud save failed: ${error.message}\n\n` +
      "Your progress is saved on this device."
    );
  } finally {
    appState.uploadInProgress = false;
  }
}

async function promptSyncCode() {
  if (!appState.tabActive || appState.switchingCode || appState.uploadInProgress) {
    return;
  }

  const enteredCode = prompt(
    "Enter your 4-digit Sync Code from your other device:"
  );

  if (enteredCode === null) {
    return;
  }

  const cleanCode = enteredCode.trim();

  if (!/^\d{4}$/.test(cleanCode)) {
    alert("Please enter a valid 4-digit code.");
    return;
  }

  appState.switchingCode = true;

  try {
    if (appState.syncTask) {
      await appState.syncTask;
    }

    if (appState.pendingXP !== 0 || appState.writeIntent) {
      await syncProgress();
    }

    const fetchedXP = await getCloudXP(cleanCode);

    const record = readRecord(cleanCode);
    appState.syncCode = cleanCode;
    appState.pendingXP = record ? record.pendingXP : readPendingXP();
    appState.writeIntent = record ? record.writeIntent || null : null;
    appState.xp = Math.max(0, fetchedXP + appState.pendingXP);

    saveLocally();
    await syncProgress();

    alert(`Successfully loaded ${appState.xp} XP from code ${appState.syncCode}!`);
  } catch (error) {
    console.error("Cloud load failed:", error);

    alert(`Could not load cloud progress: ${error.message}`);
  } finally {
    appState.switchingCode = false;
  }
}

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
      throw new Error(
        `HTTP ${response.status}: the server returned a non-JSON response.`
      );
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
  setSyncStatus("Syncing…");

  do {
    const changeToSave = appState.pendingXP;
    const localXPAtStart = appState.xp;
    let cloudXP;
    let missingSave = false;

    try {
      cloudXP = await getCloudXP(appState.syncCode);
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }

      missingSave = true;
    }

    const targetXP = missingSave
      ? localXPAtStart
      : Math.max(0, cloudXP + changeToSave);

    if (missingSave || changeToSave !== 0) {
      await saveToCloud(appState.syncCode, targetXP);
    }

    appState.pendingXP -= changeToSave;
    appState.xp = Math.max(0, targetXP + appState.pendingXP);

    saveLocally();
  } while (appState.pendingXP !== 0);

  setSyncStatus("Progress synced");
}

function syncProgress() {
  if (appState.syncTask) {
    return appState.syncTask;
  }

  appState.syncTask = performSync()
    .catch(error => {
      setSyncStatus("Sync unavailable. Progress saved on this device.");
      throw error;
    })
    .finally(() => {
      appState.syncTask = null;
    });

  return appState.syncTask;
}

async function autoSyncToCloud() {
  if (appState.switchingCode) {
    return;
  }

  try {
    await syncProgress();
  } catch (error) {
    console.warn("Automatic sync failed:", error.message);
  }
}

async function uploadProgress() {
  if (appState.uploadInProgress || appState.switchingCode) {
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
  if (appState.switchingCode || appState.uploadInProgress) {
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

    if (appState.pendingXP !== 0) {
      await syncProgress();
    }

    const fetchedXP = await getCloudXP(cleanCode);

    appState.syncCode = cleanCode;
    appState.pendingXP = readPendingXP();
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

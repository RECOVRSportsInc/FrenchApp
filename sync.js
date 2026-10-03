// Coordinate saves, interrupted writes and automatic retries.

function setSyncStatus(message) {
  const statusElement = document.getElementById("sync-status");

  if (statusElement) {
    statusElement.textContent = message;
  }
}

async function performSync() {
  if (!appState.tabActive) return;

  if (!appState.storageAvailable) {
    throw new Error(
      "Device storage is unavailable; export a backup first."
    );
  }

  setSyncStatus("Syncing…");

  const code = appState.syncCode;
  let cloudXP;
  let missing = false;

  try {
    cloudXP = await getCloudXP(code);
  } catch (error) {
    if (error.status !== 404) throw error;
    missing = true;
  }

  // Never blindly repeat a write after a timeout or reload.
  if (appState.writeIntent) {
    const intent = appState.writeIntent;

    if (missing || cloudXP !== intent.target) {
      throw new Error(
        "An interrupted save needs checking. Export a backup. " +
        "Automatic writes are paused to avoid counting XP twice."
      );
    }

    appState.pendingXP -= intent.delta;
    appState.writeIntent = null;

    appState.xp = Math.max(
      0,
      cloudXP + appState.pendingXP
    );

    saveLocally();
  }

  const delta = appState.pendingXP;

  const target = missing
    ? appState.xp
    : Math.max(0, cloudXP + delta);

  if (!Number.isSafeInteger(target)) {
    throw new Error("XP exceeds the supported limit.");
  }

  if (missing || delta !== 0) {
    appState.writeIntent = { target, delta };
    saveLocally();

    if (!appState.storageAvailable) {
      throw new Error(
        "Unable to save recovery data on this device."
      );
    }

    await saveToCloud(code, target);

    appState.pendingXP -= delta;
    appState.writeIntent = null;
  }

  appState.xp = Math.max(
    0,
    target + appState.pendingXP
  );

  saveLocally();

  appState.failures = 0;
  appState.retryAfter = 0;

  setSyncStatus(
    appState.pendingXP
      ? "Progress saved on this device. Sync pending."
      : "Progress synced"
  );
}

function syncProgress() {
  if (appState.syncTask) {
    return appState.syncTask;
  }

  appState.syncTask = performSync()
    .catch(error => {
      appState.failures++;

      const delay = Math.min(
        120000,
        5000 * 2 ** Math.min(appState.failures, 5)
      );

      appState.retryAfter = Date.now() + delay;

      setSyncStatus(
        appState.storageAvailable
          ? `Sync paused: ${error.message} Progress is saved on this device.`
          : "Device storage unavailable. Export a backup."
      );

      throw error;
    })
    .finally(() => {
      appState.syncTask = null;
    });

  return appState.syncTask;
}

async function autoSyncToCloud() {
  if (
    !appState.tabActive ||
    appState.switchingCode ||
    navigator.onLine === false ||
    Date.now() < appState.retryAfter
  ) {
    return;
  }

  try {
    await syncProgress();
  } catch (error) {
    console.warn("Automatic sync failed:", error.message);
  }
}
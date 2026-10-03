// Manual sync and switching between existing sync codes.

async function uploadProgress() {
  if (
    !appState.tabActive ||
    appState.uploadInProgress ||
    appState.switchingCode
  ) {
    return;
  }

  appState.uploadInProgress = true;

  try {
    await syncProgress();

    alert(
      `Progress synced: ${appState.xp} XP under code ${appState.syncCode}`
    );
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
  if (
    !appState.tabActive ||
    appState.switchingCode ||
    appState.uploadInProgress
  ) {
    return;
  }

  const enteredCode = prompt(
    "Enter your 4-digit Sync Code from your other device:"
  );

  if (enteredCode === null) return;

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
    appState.pendingXP = record
      ? record.pendingXP
      : readPendingXP();

    appState.writeIntent = record
      ? record.writeIntent || null
      : null;

    appState.xp = Math.max(
      0,
      fetchedXP + appState.pendingXP
    );

    saveLocally();
    await syncProgress();

    alert(
      `Successfully loaded ${appState.xp} XP from code ${appState.syncCode}!`
    );
  } catch (error) {
    console.error("Cloud load failed:", error);
    alert(`Could not load cloud progress: ${error.message}`);
  } finally {
    appState.switchingCode = false;
  }
}
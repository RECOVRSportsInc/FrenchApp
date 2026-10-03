function initApp() {
  const syncBox = document.querySelector(".sync-box");

  if (syncBox && !document.getElementById("sync-status")) {
    const statusElement = document.createElement("div");
    statusElement.id = "sync-status";
    statusElement.style.cssText =
      "margin-top:10px;font-size:0.8rem;color:#777;line-height:1.4;";

    syncBox.appendChild(statusElement);
  }

  try { loadPersistentState(); }
  catch (error) { setSyncStatus(error.message); return; }
  saveLocally();
  loadNextQuestion();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      autoSyncToCloud();
    }
  });

  window.addEventListener("focus", autoSyncToCloud);
  window.addEventListener("online", autoSyncToCloud);

  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      autoSyncToCloud();
    }
  });

  setInterval(() => {
    if (!document.hidden) {
      autoSyncToCloud();
    }
  }, REFRESH_INTERVAL);

  async function initializeFromCloud() {
    try {
      await syncProgress();
    } catch (error) {
      console.warn("Initial sync failed:", error.message);
    }
  }

  initializeFromCloud();
}

// Hold one lock for the page lifetime so another tab cannot duplicate pending XP.
if (navigator.locks && navigator.locks.request) {
  navigator.locks.request(`${APP_PREFIX}_active_tab`, {ifAvailable: true}, async lock => {
    appState.tabActive = Boolean(lock);
    if (!lock) {
      const status = document.getElementById("sync-status");
      if (status) status.textContent = "The app is open in another tab. Close that tab, then reload this one.";
      return;
    }
    initApp();
    await new Promise(() => {});
  }).catch(error => setSyncStatus(`Unable to start: ${error.message}`));
} else {
  appState.tabActive = true;
  initApp();
}
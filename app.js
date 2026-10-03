function initApp() {
  const syncBox = document.querySelector(".sync-box");

  if (syncBox && !document.getElementById("sync-status")) {
    const statusElement = document.createElement("div");
    statusElement.id = "sync-status";
    statusElement.style.cssText =
      "margin-top:10px;font-size:0.8rem;color:#777;line-height:1.4;";

    syncBox.appendChild(statusElement);
  }

  loadPersistentState();
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

initApp();
async function initApp() {
  setPracticeStatus("Loading vocabulary and sentences…");
  await expandedBanksReady;
  if (!appState.tabActive) return;
  installExpandedContent();
  if (typeof installCurriculum === "function") installCurriculum();
  if (typeof initLearningMap === "function") initLearningMap();
  const syncBox = document.querySelector(".sync-box");

  if (syncBox && !document.getElementById("sync-status")) {
    const statusElement = document.createElement("div");
    statusElement.id = "sync-status";
    statusElement.style.cssText =
      "margin-top:10px;font-size:0.8rem;color:#777;line-height:1.4;";

    syncBox.appendChild(statusElement);
  }

  try { loadPersistentState(); }
  catch (error) { throw error; }
  saveLocally();
  if (typeof initPracticeRounds === "function") initPracticeRounds();
  if (typeof initSpeechControls === "function") initSpeechControls();
  if (typeof initCourseUI === "function") initCourseUI();
  if (typeof initConversations === "function") initConversations();
  loadNextQuestion();
  if (window.appStartup) window.appStartup.ready();

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

// Acquire only after load, release before Safari suspends the outgoing page.
let startupLeaving = false;
let releaseStartupLock;
let startupStarted = false;
window.addEventListener("pagehide", () => {
  startupLeaving = true;
  appState.tabActive = false;
  if (releaseStartupLock) releaseStartupLock();
});
window.addEventListener("pageshow", event => {
  if (event.persisted) location.reload();
});
function reportStartupFailure(error) {
  if (startupLeaving) return;
  if (window.appStartup) window.appStartup.fail(error.message);
  setPracticeStatus(error.message);
  setSyncStatus(`Unable to start: ${error.message}`);
}
function requestStartupLock(attempt = 0) {
  if (startupLeaving) return;
  if (!navigator.locks || !navigator.locks.request) {
    appState.tabActive = true;
    initApp().catch(reportStartupFailure);
    return;
  }
  let granted = false;
  navigator.locks.request(`${APP_PREFIX}_active_tab`, {ifAvailable: true}, async lock => {
    if (startupLeaving) return;
    if (!lock) {
      // The previous page may still be releasing its lock during a refresh.
      if (attempt < 4) setTimeout(() => requestStartupLock(attempt + 1), 300);
      else if (window.appStartup) window.appStartup.blocked();
      return;
    }
    granted = true;
    appState.tabActive = true;
    const lifetime = new Promise(resolve => { releaseStartupLock = resolve; });
    try { await initApp(); }
    catch (error) { reportStartupFailure(error); }
    await lifetime;
  }).catch(error => {
    if (startupLeaving) return;
    appState.tabActive = false;
    const transient = /browsing context|not fully active|context is invalid/i.test(error.message);
    if (!granted && transient && attempt < 4) {
      setTimeout(() => requestStartupLock(attempt + 1), 300);
    } else reportStartupFailure(error);
  });
}
function startWhenPageIsReady() {
  if (startupStarted || startupLeaving) return;
  startupStarted = true;
  requestStartupLock();
}
if (document.readyState === "complete") startWhenPageIsReady();
else window.addEventListener("load", startWhenPageIsReady, {once: true});

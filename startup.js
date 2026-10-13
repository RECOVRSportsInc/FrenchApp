// Runs before the app modules, so failed downloads cannot leave a blank quiz.
window.appStartup = (() => {
  let phase = 'loading';
  let waitingTimer;
  function show(next, title, message) {
    phase = next;
    clearTimeout(waitingTimer);
    document.getElementById('startup-title').textContent = title;
    document.getElementById('startup-message').textContent = message;
    document.getElementById('startup-retry').hidden = next === 'loading';
    document.getElementById('startup-panel').hidden = false;
    document.getElementById('app-shell').hidden = true;
  }
  function fail(message) {
    if (phase === 'ready') return;
    show('error', 'Unable to start the app', message + ' Your saved progress has not been deleted.');
  }
  window.addEventListener('error', event => {
    if (event.target && event.target.tagName === 'SCRIPT') {
      fail('An app file could not be downloaded. Check your connection, then reload.');
    } else if (event.error) {
      fail('An app file could not start. Reload to try again.');
    }
  }, true);
  window.addEventListener('unhandledrejection', () => {
    fail('The app could not finish starting. Reload to try again.');
  });
  document.getElementById('startup-retry').addEventListener('click', () => location.reload());
  waitingTimer = setTimeout(() => {
    if (phase === 'loading') show('waiting', 'Loading is taking longer than expected',
      'Check your connection and reload. Your saved progress stays on this device.');
  }, 15000);
  return {
    ready() {
      if (phase === 'error' || phase === 'blocked') return;
      phase = 'ready';
      clearTimeout(waitingTimer);
      document.getElementById('startup-panel').hidden = true;
      document.getElementById('app-shell').hidden = false;
    },
    blocked() {
      show('blocked', 'The app is open in another tab',
        'Close the other tab using this site, then select Reload app. This protects your saved progress from duplicate updates.');
    },
    fail
  };
})();

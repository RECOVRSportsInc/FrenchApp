function todayElement(id) { return document.getElementById(`today-${id}`); }
function nextLearningStop() {
  const ordered = [learningMapSelection, ...learningTopics.map(topic => topic[0]).filter(id => id !== learningMapSelection)];
  for (const category of ordered) {
    const tiers = roadmapTopic(category);
    for (let tier = 0; tier < 3; tier++) {
      if (tiers[tier].passed) continue;
      const lesson = courseLessons.findIndex(item => !tiers[tier].lessons[item.id]);
      return {category, tier, lesson: lesson < 0 ? null : lesson};
    }
  }
  return null;
}
function continueDailyLearning() {
  const stop = nextLearningStop();
  if (stop) prepareCourseSession(stop.category, stop.tier, stop.lesson);
  else { showLearningView('learn'); renderLearningMap(); }
}
function renderToday() {
  if (!todayElement('page') || !appState.syncCode) return;
  const store = readDailyStore(), summary = dailySummary(), stop = nextLearningStop();
  todayElement('date').textContent = new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'});
  todayElement('pair').textContent = `${languageCatalog[learningLanguage].name} → ${languageCatalog[answerLanguage].name}`;
  todayElement('goal').value = String(summary.goal);
  todayElement('goal').disabled = store.blocked;
  todayElement('meter').max = summary.goal; todayElement('meter').value = Math.min(summary.goal, summary.sessions);
  todayElement('goal-label').textContent = summary.sessions >= summary.goal ? 'Daily goal complete' : 'Make room for a little practice';
  todayElement('count').textContent = `${summary.sessions} / ${summary.goal} sessions completed today`;
  todayElement('streak').textContent = summary.streak;
  todayElement('best').textContent = summary.best;
  todayElement('active').textContent = summary.active;
  todayElement('visits').textContent = `${summary.visited} ${summary.visited === 1 ? 'day' : 'days'} visited · visits alone do not earn a streak`;
  todayElement('continue').textContent = stop ? 'Continue learning' : 'Review your roadmap';
  todayElement('continue').disabled = readRoadmapStore().blocked;
  todayElement('recommendation').textContent = stop
    ? `${contentCategories[stop.category]} · ${courseTiers[stop.tier].title} · ${stop.lesson === null ? 'Tier test' : courseLessons[stop.lesson].title}`
    : 'All tiers cleared. Revisit a topic or practise a conversation.';
  todayElement('notice').textContent = store.error || 'Finish a lesson, tier test, practice round or conversation to keep your streak. A completed session counts even when you need another attempt.';
  todayElement('week').replaceChildren();
  const days = []; let day = learningDay();
  for (let index = 0; index < 7; index++) { days.unshift(day); day = previousLearningDay(day); }
  for (const key of days) {
    const value = store.data?.days[key], count = Object.keys(value?.sessions || {}).length;
    const cell = document.createElement('li');
    cell.className = count ? 'daily-done' : Object.keys(value?.visits || {}).length ? 'daily-visited' : '';
    const label = document.createElement('span'); label.textContent = new Date(key + 'T12:00:00').toLocaleDateString(undefined, {weekday: 'short'});
    const mark = document.createElement('strong'); mark.textContent = count ? '✓' : '·';
    cell.setAttribute('aria-label', `${key}: ${count} completed sessions`);
    if (key === learningDay()) cell.setAttribute('aria-current', 'date');
    cell.append(label, mark); todayElement('week').appendChild(cell);
  }
  todayElement('timezone').textContent = `Days follow this device’s local time (${Intl.DateTimeFormat().resolvedOptions().timeZone}). Past activity dates stay as recorded. Your daily goal spans all learning languages.`;
  renderLearningSyncControls();
}
function initToday() {
  if (todayElement('page')) return;
  const section = document.createElement('section'); section.id = 'today-page'; section.className = 'today-page';
  section.setAttribute('aria-labelledby', 'today-heading');
  section.innerHTML = `<div class="today-intro"><p class="eyebrow" id="today-date"></p><h1 id="today-heading">A little practice. Every day.</h1><p id="today-pair"></p></div>
    <div class="today-hero"><div><p class="eyebrow">YOUR DAILY GOAL</p><h2 id="today-goal-label"></h2><p id="today-count"></p></div><label>Daily goal<select id="today-goal"><option value="1">1 session</option><option value="2">2 sessions</option><option value="3">3 sessions</option></select></label><progress id="today-meter" max="1" value="0" aria-label="Daily goal progress"></progress></div>
    <div class="today-stats"><div><strong id="today-streak">0</strong><span>Current streak</span></div><div><strong id="today-best">0</strong><span>Longest streak</span></div><div><strong id="today-active">0</strong><span>Days practised</span></div></div>
    <section class="today-card"><h2>Your week</h2><ol id="today-week" class="today-week"></ol><p id="today-visits"></p><p id="today-notice" role="status"></p></section>
    <section class="today-card"><p class="eyebrow">YOUR NEXT STEP</p><h2 id="today-recommendation"></h2><div class="today-actions"><button id="today-continue" type="button">Continue learning</button><button id="today-round" type="button">Practise 10 questions</button><button id="today-conversation" type="button">Try a conversation</button></div><p>Your next lesson follows your selected topic and completed roadmap stops.</p></section>
    <section id="learning-sync-panel" class="today-card"></section><p id="today-timezone" class="today-note"></p>`;
  document.getElementById('learning-map').before(section);
  const nav = document.querySelector('.learning-nav'), button = document.createElement('button');
  button.type = 'button'; button.dataset.learningTab = 'today'; button.innerHTML = '<span aria-hidden="true">◷</span>Today';
  button.onclick = () => { recordDailyVisit(); renderToday(); showLearningView('today'); }; nav.prepend(button);
  todayElement('goal').onchange = event => setDailyGoal(Number(event.target.value));
  todayElement('continue').onclick = continueDailyLearning;
  todayElement('round').onclick = () => startPracticeRound();
  todayElement('conversation').onclick = () => showLearningView('conversations');
  const talk = nav.querySelector('[data-learning-tab="conversations"]');
  talk.setAttribute('aria-label', 'Conversations');
  const caption = document.createElement('span'); caption.className = 'nav-caption';
  caption.innerHTML = '<span class="nav-full">Conversations</span><span class="nav-short" aria-hidden="true">Talk</span>';
  talk.lastChild.replaceWith(caption);
  initLearningSyncControls(); recordDailyVisit(); renderToday(); showLearningView('today');
  const refresh = () => { recordDailyVisit(); renderToday(); if (Date.now() >= learningSyncState.retryAt) syncLearningProgress(); };
  window.addEventListener('focus', refresh); window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden && appState.tabActive && !appState.switchingCode) refresh(); }, 60000);
  scheduleLearningSync();
}

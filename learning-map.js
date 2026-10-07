// Topic progress reflects this device's history for the selected language pair.
const learningTopics = [
  ['work', '#18a9e6', 'M5 7h14v13H5z M9 7V4h6v3 M5 12h14 M10 12v3h4v-3'],
  ['healthcare', '#ef6268', 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'],
  ['sports', '#83bf27', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-6 6-6 12 0 18 M12 3c6 6 6 12 0 18'],
  ['travel', '#a58ce6', 'M3 13l7-3V4l2-2 2 2v6l7 3v3l-7-2v5l3 2H7l3-2v-5l-7 2z'],
  ['home', '#f0a233', 'M3 11l9-8 9 8 M6 9v12h12V9 M10 21v-7h4v7'],
  ['gym', '#2abca7', 'M3 8v8 M6 5v14 M6 12h12 M18 5v14 M21 8v8'],
  ['phrases', '#39a9d5', 'M4 4h16v12H10l-6 5z M8 8h8 M8 12h5'],
  ['slang', '#e183ad', 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z']
];
let learningMapSelection = 'work';
function showLearningView(view) {
  document.body.dataset.learningView = view;
  for (const button of document.querySelectorAll('[data-learning-tab]')) {
    const active = button.dataset.learningTab === view;
    button.setAttribute('aria-pressed', String(active));
  }
  const heading = document.getElementById(view === 'learn' ? 'map-heading' : view === 'progress' ? 'history-heading-title' : 'word-display');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
}
function initLearningMap() {
  if (document.getElementById('learning-map')) return;
  const section = document.createElement('section');
  section.id = 'learning-map';
  section.className = 'learning-map';
  section.setAttribute('aria-labelledby', 'map-heading');
  section.innerHTML = '<div class="map-intro"><p class="eyebrow">YOUR LEARNING PATH</p><h1 id="map-heading">Where will you go today?</h1><p>Choose a topic. Build your confidence, one answer at a time.</p></div><div class="topic-grid" id="topic-grid"></div><p class="map-footnote">Rings show items answered correctly at least once, for your selected level and language pair. Progress is saved on this device.</p>';
  document.querySelector('.layout').before(section);
  const nav = document.createElement('nav');
  nav.className = 'learning-nav';
  nav.setAttribute('aria-label', 'Main navigation');
  for (const [view, label, symbol] of [['learn','Learn','◉'],['practice','Practice','▷'],['progress','Progress','▥']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.learningTab = view;
    button.innerHTML = `<span aria-hidden="true">${symbol}</span>`;
    button.append(document.createTextNode(label));
    button.onclick = () => showLearningView(view);
    nav.appendChild(button);
  }
  document.querySelector('.shell').appendChild(nav);
  document.querySelector('.layout > .card').id = 'practice-card';
  document.querySelector('.history-heading h2').id = 'history-heading-title';
  document.body.dataset.learningView = 'learn';
  for (const button of nav.children) button.setAttribute('aria-pressed', String(button.dataset.learningTab === 'learn'));
}
function renderLearningMap() {
  const grid = document.getElementById('topic-grid');
  if (!grid) return;
  if (practiceCategory !== 'all') learningMapSelection = practiceCategory;
  const history = readWordHistory().data.pairs[currentHistoryPair()] || {};
  const rows = getPracticeLibrary().filter(row => practiceLevel === 'all' || levelFor(row, practiceMode) === practiceLevel);
  const previousFocus = document.activeElement;
  const focusedTopic = previousFocus && previousFocus.dataset ? previousFocus.dataset.topic : null;
  grid.replaceChildren();
  let detailNode = null, topicIndex = 0;
  for (const [category, colour, path] of learningTopics) {
    const seen = new Set(), items = [];
    for (const row of rows.filter(item => categoriesFor(item).includes(category))) {
      const key = normalizeMeaning(questionTextFor(row)) + ':' + normalizeMeaning(translationFor(row, answerLanguage));
      if (!seen.has(key)) { seen.add(key); items.push(row); }
    }
    const completed = items.filter(row => history[row.id] && history[row.id].correct > 0).length;
    const percentage = items.length ? Math.round(completed / items.length * 100) : 0;
    const label = category === 'slang' ? (learningLanguage === 'ar' ? 'Everyday expressions' : 'Casual expressions') : contentCategories[category];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'topic-node';
    button.dataset.topic = category;
    button.style.setProperty('--topic-colour', colour);
    button.style.setProperty('--topic-progress', `${percentage}%`);
    button.setAttribute('aria-pressed', String(learningMapSelection === category));
    button.setAttribute('aria-label', `${label}: ${completed} of ${items.length} items answered correctly. Choose topic.`);
    button.innerHTML = `<span class="topic-ring"><span class="topic-disc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg></span></span>`;
    const title = document.createElement('strong'); title.textContent = label;
    const progress = document.createElement('span'); progress.className = 'topic-caption'; progress.textContent = `${completed} / ${items.length} correct`;
    button.append(title, progress);
    button.onclick = () => { learningMapSelection = category; selectPractice(practiceMode, practiceLevel, category); renderLearningMap(); };
    grid.appendChild(button);
    if (learningMapSelection === category) {
      const detail = document.createElement('div');
      detail.className = 'topic-detail';
      detail.style.setProperty('--topic-colour', colour);
      const title = document.createElement('h2'); title.textContent = label;
      const text = document.createElement('p');
      text.textContent = `${contentLevels[practiceLevel]} · ${practiceMode === 'sentences' ? 'Sentences' : 'Vocabulary'} · ${completed} of ${items.length} answered correctly`;
      const start = document.createElement('button'); start.className = 'topic-start'; start.type = 'button'; start.textContent = 'Start practice';
      start.onclick = () => {
        if (!appState.tabActive || appState.switchingCode) return;
        selectPractice(practiceMode, practiceLevel, category);
        showLearningView('practice');
      };
      detail.append(title, text, start);
      detailNode = detail;
    }
    if (topicIndex % 2 === 1 && detailNode) { grid.appendChild(detailNode); detailNode = null; }
    topicIndex++;
  }
  if (focusedTopic) {
    const target = [...grid.querySelectorAll('[data-topic]')].find(node => node.dataset.topic === focusedTopic);
    if (target) target.focus({ preventScroll: true });
  }
}

function conversationElement(id) { return document.getElementById(`conversation-${id}`); }
function initConversations() {
  if (conversationElement('page')) return;
  const section = document.createElement('section');
  section.id = 'conversation-page';
  section.setAttribute('aria-labelledby', 'conversation-heading');
  section.innerHTML = '<div class="conversation-intro"><p class="eyebrow">REAL-LIFE PRACTICE</p><h1 id="conversation-heading">A small shop. A real conversation.</h1><p>Buy fruit, ask the price and pay. Your choices shape what happens next.</p></div><div class="conversation-card"><div class="conversation-scene"><span class="conversation-avatar" aria-hidden="true">C</span><div><h2 id="conversation-name">Your shopkeeper</h2><p id="conversation-register"></p></div><span class="conversation-badge">Grocery store</span></div><div class="conversation-setup"><label for="conversation-level">Conversation level</label><select id="conversation-level"><option value="easy">Easy · suggested replies</option><option value="medium">Medium · type your replies</option><option value="hard">Hard · unexpected problems</option></select><button type="button" id="conversation-start">Start conversation</button></div><p id="conversation-description">A guided scene with written branches. English hints are available. Typed replies accept the example phrases and selected everyday variants.</p><div id="conversation-session" hidden><progress id="conversation-progress" max="5" value="0" aria-label="Shopping goals completed"></progress><p id="conversation-goals"></p><div id="conversation-log" aria-label="Conversation transcript"></div><div class="conversation-tools"><button type="button" id="conversation-listen">Listen</button><button type="button" id="conversation-slow">Listen slowly</button><button type="button" id="conversation-translate">Show English meaning</button><button type="button" id="conversation-hint">Help me reply</button></div><p id="conversation-translation" hidden></p><p id="conversation-task"></p><div id="conversation-replies" hidden></div><form id="conversation-form"><label for="conversation-input">Your reply</label><div class="conversation-input-row"><input id="conversation-input" type="text" maxlength="240" autocomplete="off"><button type="submit">Send reply</button></div></form><p id="conversation-feedback" role="status" aria-live="polite"></p><div id="conversation-results" hidden></div></div></div>';
  document.querySelector('.layout').before(section);
  conversationElement('start').onclick = beginGroceryScene;
  conversationElement('level').onchange = () => resetConversationScene();
  conversationElement('form').onsubmit = event => { event.preventDefault(); sendGroceryText(); };
  conversationElement('listen').onclick = () => speakGroceryCharacter();
  conversationElement('slow').onclick = () => speakGroceryCharacter(true);
  conversationElement('hint').onclick = () => {
    if (!conversationIsCurrent()) return;
    markGroceryHelp('reply');
    renderGroceryReplies(true);
  };
  conversationElement('translate').onclick = () => {
    if (!conversationIsCurrent()) return;
    markGroceryHelp('translation');
    const line = groceryConversation.transcript.filter(turn => turn.speaker === 'character').at(-1).line;
    conversationElement('translation').textContent = line[2];
    conversationElement('translation').hidden = false;
  };
  for (const id of ['practice-level', 'practice-category', 'answer-language']) document.getElementById(id)?.parentElement?.classList.add('quiz-filter');
  window.addEventListener?.('resize', () => { const log = conversationElement('log'); if (log && document.body.dataset.learningView === 'conversations') log.scrollTop = log.scrollHeight; });
  renderConversationLanding();
}
function conversationIsCurrent() {
  return Boolean(groceryConversation && !groceryConversation.complete && groceryConversation.language === learningLanguage &&
    groceryConversation.owner === appState.syncCode && appState.tabActive && !appState.switchingCode);
}
function renderConversationLanding() {
  if (!conversationElement('page')) return;
  if (groceryConversation && (groceryConversation.language !== learningLanguage || groceryConversation.owner !== appState.syncCode)) resetConversationScene();
  const available = ['fr', 'ar'].includes(learningLanguage);
  const locale = conversationLocale(learningLanguage);
  conversationElement('start').disabled = !available || !appState.tabActive || appState.switchingCode;
  conversationElement('name').textContent = available ? groceryDialogue.character[locale] : 'Choose a supported language';
  conversationElement('register').textContent = !available ? 'Select French (France) or Modern Standard Arabic above.' : learningLanguage === 'ar'
    ? 'Modern Standard Arabic. This scene addresses a male customer.' : 'French (France) · A friendly neighbourhood shopkeeper';
  document.querySelector('.conversation-avatar').textContent = available && learningLanguage === 'ar' ? 'ل' : 'C';
}
function resetConversationScene() {
  window.speechSynthesis?.cancel();
  groceryConversation = null;
  if (conversationElement('session')) conversationElement('session').hidden = true;
}
function beginGroceryScene() {
  if (!appState.tabActive || appState.switchingCode) return;
  window.speechSynthesis?.cancel();
  if (typeof endPracticeRound === 'function') endPracticeRound();
  if (!startGroceryConversation(learningLanguage, conversationElement('level').value)) return;
  conversationElement('session').hidden = false;
  renderGroceryTurn();
}
function sendGroceryText() {
  if (!conversationIsCurrent()) { renderConversationLanding(); return; }
  const text = conversationElement('input').value.trim();
  if (!text) { conversationElement('feedback').textContent = 'Write a reply before sending.'; return; }
  const choice = matchGroceryReply(text);
  if (!choice) {
    groceryConversation.retries++;
    conversationElement('feedback').textContent = 'Try another way to say it, or use “Help me reply” for an example.';
    return;
  }
  advanceGroceryConversation(choice.id, text);
  renderGroceryTurn();
}
function renderGroceryReplies(show) {
  const container = conversationElement('replies');
  container.replaceChildren(); container.hidden = !show;
  if (!show || !groceryConversation || groceryConversation.complete) return;
  for (const choice of shuffleOptions(groceryDialogue[groceryConversation.node].choices)) {
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = choice.text[conversationLocale()];
    button.lang = languageCatalog[groceryConversation.language].speech;
    button.dir = languageCatalog[groceryConversation.language].direction;
    const node = groceryConversation.node, state = groceryConversation;
    button.onclick = () => {
      if (!conversationIsCurrent() || groceryConversation !== state || state.node !== node) return;
      advanceGroceryConversation(choice.id); renderGroceryTurn();
    };
    container.appendChild(button);
  }
}
function renderGroceryTurn() {
  window.speechSynthesis?.cancel();
  renderGroceryTranscript();
  const state = groceryConversation;
  const completed = groceryGoals().filter(goal => goal[1]).length;
  conversationElement('progress').value = completed;
  conversationElement('goals').textContent = `${completed} / 5 shopping goals completed`;
  conversationElement('translation').hidden = true;
  conversationElement('feedback').textContent = '';
  conversationElement('input').value = '';
  conversationElement('input').lang = languageCatalog[state.language].speech;
  conversationElement('input').dir = languageCatalog[state.language].direction;
  conversationElement('input').placeholder = state.language === 'ar' ? 'اكتب ردك هنا…' : 'Écrivez votre réponse…';
  conversationElement('form').hidden = state.complete || state.level === 'easy';
  for (const id of ['listen', 'slow', 'translate', 'hint']) conversationElement(id).hidden = state.complete;
  conversationElement('results').hidden = !state.complete;
  conversationElement('task').textContent = state.complete ? '' : groceryDialogue[state.node].task;
  renderGroceryReplies(!state.complete && state.level === 'easy');
  if (state.complete) { renderGroceryResults(); return; }
  const prompt = groceryLine()[conversationLocale()];
  conversationElement('feedback').textContent = `${groceryDialogue.character[conversationLocale()]}: ${prompt}`;
  conversationElement('feedback').lang = languageCatalog[state.language].speech;
  conversationElement('feedback').dir = languageCatalog[state.language].direction;
  if (state.level !== 'easy') { conversationElement('input').focus(); conversationElement('input').scrollIntoView?.({ block: 'center' }); }
  if (speechAutoPlay() && document.body.dataset.learningView === 'conversations') speakGroceryCharacter();
}

function onConversationViewChange(view) {
  window.speechSynthesis?.cancel();
  if (view === 'conversations') {
    if (typeof endPracticeRound === 'function') endPracticeRound();
    renderConversationLanding();
  } else if (view === 'practice' && document.body.dataset.learningView === 'conversations' && typeof loadNextQuestion === 'function') {
    loadNextQuestion();
  }
}

function renderGroceryTranscript() {
  const log = conversationElement('log');
  log.replaceChildren();
  const locale = conversationLocale();
  const language = languageCatalog[groceryConversation.language];
  for (const turn of groceryConversation.transcript) {
    const bubble = document.createElement('div');
    bubble.className = `conversation-bubble ${turn.speaker}`;
    const name = document.createElement('span');
    name.className = 'conversation-speaker';
    name.textContent = turn.speaker === 'character' ? groceryDialogue.character[locale] : 'You';
    const text = document.createElement('p');
    text.textContent = turn.line[locale]; text.lang = language.speech; text.dir = language.direction;
    bubble.append(name, text); log.appendChild(bubble);
  }
  log.scrollTop = log.scrollHeight;
}
function renderGroceryResults() {
  const state = groceryConversation;
  const container = conversationElement('results'); container.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = 'Shopping complete!'; heading.tabIndex = -1;
  const summary = document.createElement('p');
  const fruit = { apples: 'apples', green: 'green apples', bananas: 'bananas' }[state.fruit];
  summary.textContent = `You bought ${state.quantity} kg of ${fruit}${state.milk ? ' and a bottle of milk' : ''} for ${groceryTotal()} ${state.language === 'ar' ? 'dinars' : 'euros'}.`;
  const goals = document.createElement('ul');
  for (const [label, complete] of groceryGoals()) {
    const row = document.createElement('li'); row.textContent = `${complete ? '✓' : '○'} ${label}`; goals.appendChild(row);
  }
  const stats = document.createElement('p');
  stats.textContent = `${state.turns} replies · ${state.independent} typed without reply hints · ${state.hints} reply hints · ${state.translations} English reveals`;
  const note = document.createElement('p'); note.className = 'conversation-note';
  note.textContent = 'Try again with a different fruit, quantity or payment method. These results describe this conversation; they are not a fluency score.';
  const again = document.createElement('button'); again.type = 'button'; again.textContent = 'Shop again'; again.onclick = beginGroceryScene;
  container.append(heading, summary, goals, stats, note, again);
  heading.focus({ preventScroll: true });
}
function speakGroceryCharacter(slow = false) {
  if (!conversationIsCurrent()) return;
  const state = groceryConversation, node = state.node;
  const voiceList = matchingVoices();
  const preferred = document.getElementById('voice-choice')?.value || voicePreferences.voices[state.language];
  const voice = voiceList.find(item => item.voiceURI === preferred) || voiceList[0];
  if (!voice) { conversationElement('feedback').textContent = 'No voice for this language is available. You can continue with the text or add a language voice on your device.'; return; }
  try {
    window.speechSynthesis.cancel();
    const line = state.transcript.filter(turn => turn.speaker === 'character').at(-1).line[conversationLocale()];
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = slow ? .75 : 1;
    utterance.onerror = event => {
      if (groceryConversation !== state || state.node !== node || document.body.dataset.learningView !== 'conversations' || ['canceled', 'interrupted'].includes(event.error)) return;
      conversationElement('feedback').textContent = 'Audio could not play. Continue with the text or try another voice in Practice.';
    };
    window.speechSynthesis.speak(utterance);
  } catch { conversationElement('feedback').textContent = 'Audio is unavailable. You can continue with the text.'; }
}

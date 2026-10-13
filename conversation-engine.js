// Explicit branches and accepted phrases keep this first scene predictable.
let groceryConversation = null;
function conversationLocale(language = groceryConversation?.language || learningLanguage) { return language === 'ar' ? 1 : 0; }
function normalizeConversationReply(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/ـ/gu, '')
    .replace(/[’']/gu, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/gu, ' ').trim();
}
function groceryTotal(state = groceryConversation) {
  return state.quantity * (state.language === 'ar' ? 3 : 2) + (state.milk ? 2 : 0);
}
function groceryLine(node = groceryConversation.node) {
  const line = [...groceryDialogue[node].line];
  if (node === 'checkout') {
    const total = groceryTotal();
    line[0] = `Ça fait ${total} euros. ${line[0]}`;
    line[1] = `المبلغ ${total} دنانير. ${line[1]}`;
    line[2] = `That’s ${total} ${groceryConversation.language === 'ar' ? 'dinars' : 'euros'}. ${line[2]}`;
  }
  return line;
}
function startGroceryConversation(language = learningLanguage, level = 'easy') {
  if (!['fr', 'ar'].includes(language) || !['easy', 'medium', 'hard'].includes(level)) return false;
  groceryConversation = { language, level, node: 'welcome', transcript: [], turns: 0, independent: 0,
    hints: 0, translations: 0, retries: 0, assisted: false, fruit: '', quantity: 0, milk: false,
    milkType: '', payment: '', bag: '', complete: false, owner: appState.syncCode };
  appendGroceryCharacter();
  return true;
}
function appendGroceryCharacter() {
  groceryConversation.transcript.push({ speaker: 'character', line: groceryLine() });
}
function matchGroceryReply(text, state = groceryConversation) {
  if (!state || state.complete) return null;
  const normalized = normalizeConversationReply(text);
  if (!normalized) return null;
  const locale = conversationLocale(state.language);
  const withoutCourtesy = value => normalizeConversationReply(value).replace(/ (sil vous plait|من فضلك)$/u, '');
  return groceryDialogue[state.node].choices.find(choice => {
    const variants = [choice.text[locale], ...(choice.aliases[locale] || [])];
    if (state.node === 'quantity') {
      const fruit = state.fruit === 'bananas' ? ['bananes', 'الموز'] : ['pommes', 'التفاح'];
      const amount = choice.id === 'one' ? ['un kilo', 'كيلوغراما واحدا'] : ['deux kilos', 'كيلوغرامين'];
      variants.push(locale === 0 ? `Je voudrais ${amount[0]} de ${fruit[0]}` : `أريد ${amount[1]} من ${fruit[1]}`);
    }
    return variants.some(value => withoutCourtesy(value) === withoutCourtesy(text));
  }) || null;
}
function advanceGroceryConversation(choiceId, typedText = '') {
  const state = groceryConversation;
  if (!state || state.complete || state.owner !== appState.syncCode) return false;
  const choice = groceryDialogue[state.node].choices.find(item => item.id === choiceId);
  if (!choice || (typedText && matchGroceryReply(typedText)?.id !== choiceId)) return false;
  const line = [...choice.text];
  if (typedText) line[conversationLocale()] = typedText;
  state.transcript.push({ speaker: 'learner', line });
  state.turns++;
  if (typedText && !state.assisted) state.independent++;
  state.assisted = false;
  const previous = state.node;
  if (previous === 'welcome') {
    state.fruit = choiceId;
    state.node = state.level === 'hard' && choiceId === 'apples' ? 'stock' : 'quantity';
  } else if (previous === 'stock') { state.fruit = choiceId; state.node = 'quantity'; }
  else if (previous === 'quantity') { state.quantity = choiceId === 'one' ? 1 : 2; state.node = state.level === 'easy' ? 'price' : 'extra'; }
  else if (previous === 'extra') { state.milk = choiceId === 'milk'; state.node = state.milk && state.level === 'hard' ? 'milk' : 'price'; }
  else if (previous === 'milk') { state.milkType = choiceId; state.node = 'price'; }
  else if (previous === 'price') state.node = 'checkout';
  else if (previous === 'checkout') { state.payment = choiceId; state.node = state.level === 'hard' && choiceId === 'card' ? 'payment' : 'bag'; }
  else if (previous === 'payment') {
    state.payment = choiceId === 'wait' ? 'card' : 'cash';
    state.transcript.push({ speaker: 'character', line: choiceId === 'wait'
      ? ['Merci d’avoir patienté. Le terminal fonctionne maintenant, le paiement est passé.', 'شكرًا على الانتظار. الجهاز يعمل الآن وقد تم الدفع.', 'Thanks for waiting. The machine works now and the payment went through.']
      : ['Merci, voici votre monnaie.', 'شكرًا، تفضل الباقي.', 'Thank you, here’s your change.'] });
    state.node = 'bag';
  } else if (previous === 'bag') { state.bag = choiceId; state.node = 'goodbye'; }
  else if (previous === 'goodbye') { state.complete = true; return true; }
  appendGroceryCharacter();
  return true;
}
function markGroceryHelp(kind) {
  if (!groceryConversation || groceryConversation.complete) return;
  if (kind === 'translation') groceryConversation.translations++;
  else { groceryConversation.hints++; groceryConversation.assisted = true; }
}
function groceryGoals() {
  const state = groceryConversation;
  if (!state) return [];
  return [['Choose fruit', Boolean(state.fruit)], ['Specify quantity', state.quantity > 0],
    ['Ask the price', state.transcript.some(turn => turn.speaker === 'learner' && turn.line[2].includes('How much'))],
    ['Arrange payment', Boolean(state.payment) && ['bag', 'goodbye'].includes(state.node)], ['Finish politely', state.complete]];
}

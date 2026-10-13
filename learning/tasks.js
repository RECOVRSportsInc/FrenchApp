function normalizeCourseAnswer(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ł/gu, 'l').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي')
    .replace(/[’']/gu, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/gu, ' ').trim();
}
function courseWordAnswer(text, language) {
  const cleaned = cleanCourseText(text).replace(language.startsWith('fr') || language === 'it' ? /^l['’]/iu : /$^/u, '');
  const normalized = normalizeCourseAnswer(cleaned);
  const prefixes = { en: /^(the|a|an) /u, fr: /^(le|la|les|un|une|des) /u,
    frCA: /^(le|la|les|un|une|des) /u, es: /^(el|la|los|las|un|una) /u, it: /^(il|lo|la|i|gli|le|un|una) /u };
  return prefixes[language] ? normalized.replace(prefixes[language], '') : normalized;
}
const courseAnswerVariantCache = new Map();
function courseAnswerVariants(row, language) {
  const category = categoriesFor(row)[0], key = `${row.id}:${language}`;
  if (courseAnswerVariantCache.has(key)) return courseAnswerVariantCache.get(key);
  const meaning = courseWordAnswer(row.en, 'en');
  const values = vocabulary.filter(other => other.mode === 'vocabulary' && categoriesFor(other).includes(category) &&
    (!other.sourceLanguage || other.sourceLanguage === language) && (!other.bankPattern || other.bankPattern === 'vocabulary:1') &&
    translationFor(other, language) && courseWordAnswer(other.en, 'en') === meaning).map(other => courseTranslation(other, language));
  values.push(...(row.aliases?.[language] || []), ...(language === 'frCA' ? row.aliases?.fr || [] : []));
  courseAnswerVariantCache.set(key, values); return values;
}
function courseTask(row, tier, pool, learning = learningLanguage, answers = answerLanguage) {
  const source = courseTranslation(row, learning), meaning = courseTranslation(row, answers);
  const reverse = tier !== 'easy';
  const task = { row, tier, source, meaning, prompt: reverse ? meaning : source, answer: reverse ? source : meaning,
    responseLanguage: reverse ? learning : answers, promptLanguage: reverse ? answers : learning };
  if (tier === 'hard') {
    task.kind = row.mode === 'sentences' ? 'order' : 'recall';
    task.accepted = task.kind === 'recall' ? [source, ...courseAnswerVariants(row, learning)] : [source];
    task.tokens = source.split(/\s+/u);
  } else {
    task.kind = 'choice';
    const used = new Set([normalizeCourseAnswer(task.answer)]), distractors = [];
    for (const other of shuffleOptions(pool.filter(item => item.mode === row.mode && item.id !== row.id))) {
      const otherSource = courseTranslation(other, learning), otherMeaning = courseTranslation(other, answers);
      if (normalizeCourseAnswer(otherSource) === normalizeCourseAnswer(source) || normalizeCourseAnswer(otherMeaning) === normalizeCourseAnswer(meaning)) continue;
      const value = reverse ? otherSource : otherMeaning, key = normalizeCourseAnswer(value);
      if (used.has(key)) continue;
      used.add(key); distractors.push(value);
      if (distractors.length === (tier === 'easy' ? 2 : 3)) break;
    }
    task.options = shuffleOptions([task.answer, ...distractors]);
  }
  return task;
}
function gradeCourseTask(task, response) {
  return task.kind === 'recall' ? (task.accepted || [task.answer]).some(value => courseWordAnswer(response, task.responseLanguage) === courseWordAnswer(value, task.responseLanguage))
    : normalizeCourseAnswer(response) === normalizeCourseAnswer(task.answer);
}
function renderCourseTask(container, task, submit) {
  container.replaceChildren();
  const button = (text, action) => {
    const node = document.createElement('button'); node.type = 'button'; node.textContent = text;
    node.lang = languageCatalog[task.responseLanguage].speech; node.dir = languageCatalog[task.responseLanguage].direction;
    node.className = 'course-choice'; node.onclick = action; return node;
  };
  if (task.kind === 'choice') {
    for (const option of task.options) container.appendChild(button(option, () => submit(option)));
    return;
  }
  if (task.kind === 'recall') {
    const form = document.createElement('form'), label = document.createElement('label'), input = document.createElement('input');
    label.textContent = `Write the ${languageCatalog[task.responseLanguage].name} word or expression`;
    input.type = 'text'; input.maxLength = 240; input.autocomplete = 'off'; input.spellcheck = false;
    input.lang = languageCatalog[task.responseLanguage].speech; input.dir = languageCatalog[task.responseLanguage].direction;
    input.setAttribute('aria-label', label.textContent);
    const send = document.createElement('button'); send.type = 'submit'; send.textContent = 'Check answer';
    form.append(label, input, send); form.onsubmit = event => { event.preventDefault(); if (input.value.trim()) submit(input.value.trim()); };
    container.appendChild(form); return;
  }
  const instruction = document.createElement('p'); instruction.textContent = 'Rebuild the taught sentence. Tap words in order; tap a selected word to remove it.';
  const result = document.createElement('div'), bank = document.createElement('div'); result.className = 'course-token-answer'; bank.className = 'course-token-bank';
  result.setAttribute('aria-label', 'Your sentence'); result.dir = bank.dir = languageCatalog[task.responseLanguage].direction;
  let selected = [];
  const ordered = shuffleOptions(task.tokens.map((text, index) => ({ text, index })));
  const refresh = () => {
    result.replaceChildren(); bank.replaceChildren();
    for (const index of selected) result.appendChild(button(task.tokens[index], () => { selected = selected.filter(value => value !== index); refresh(); }));
    for (const token of ordered) {
      const node = button(token.text, () => { if (!selected.includes(token.index)) selected.push(token.index); refresh(); }); node.disabled = selected.includes(token.index); bank.appendChild(node);
    }
    send.disabled = selected.length !== task.tokens.length;
  };
  const send = document.createElement('button'); send.type = 'button'; send.textContent = 'Check sentence';
  send.onclick = () => { if (selected.length === task.tokens.length) submit(selected.map(index => task.tokens[index]).join(' ')); };
  container.append(instruction, result, bank, send); refresh();
}

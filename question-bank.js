// Reuse translations and question pools while practice selections stay unchanged.
const practicePoolCache = new Map();
const translatedLibraryCache = new Map();
function rememberPracticePool(cache, key, value, limit = 8) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > limit) cache.delete(cache.keys().next().value);
  return value;
}
function getTranslatedLibrary() {
  const library = getPracticeLibrary();
  const key = `${practiceMode}:${learningLanguage}:${answerLanguage}:${library.length}`;
  if (translatedLibraryCache.has(key)) return translatedLibraryCache.get(key);
  const meanings = new Map();
  const items = library.map(row => {
    const text = questionTextFor(row), answer = translationFor(row, answerLanguage);
    const source = normalizeMeaning(text), target = normalizeMeaning(answer);
    if (!meanings.has(source)) meanings.set(source, new Set());
    meanings.get(source).add(target);
    return { row, text, answer, source, target };
  });
  return rememberPracticePool(translatedLibraryCache, key, { items, meanings });
}
function chooseDistractors(pools, excluded, question) {
  const selected = [], used = new Set(excluded);
  for (const pool of pools) {
    if (!pool.length) continue;
    const start = Math.floor(Math.random() * pool.length);
    const step = pool.length > 1 ? pool.length - 1 : 1;
    for (let offset = 0; offset < pool.length && selected.length < 3; offset++) {
      const item = pool[(start + offset * step) % pool.length];
      if (used.has(item.target) || (question.row.bankTopic && item.row.bankTopic === question.row.bankTopic)) continue;
      used.add(item.target);
      selected.push(item.answer);
    }
    if (selected.length === 3) break;
  }
  return selected;
}

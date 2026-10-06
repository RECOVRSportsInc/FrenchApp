// Build questions for the selected language pair.

function shuffleOptions(options) {
  const result = [...options];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeMeaning(value) {
  return value.normalize("NFC").trim().toLocaleLowerCase().replace(/[.!?؟]+$/u, "");
}

function getActiveWords() {
  const { items, meanings } = getTranslatedLibrary();
  const key = `${practiceMode}:${learningLanguage}:${answerLanguage}:${practiceCategory}:${practiceLevel}:${items.length}`;
  if (practicePoolCache.has(key)) return practicePoolCache.get(key);
  const categoryItems = items.filter(item => practiceCategory === "all" || categoriesFor(item.row).includes(practiceCategory));
  const rows = categoryItems.filter(item => practiceLevel === "all" || levelFor(item.row, practiceMode) === practiceLevel);
  const patterns = new Map();
  for (const item of categoryItems) {
    if (!patterns.has(item.row.bankPattern)) patterns.set(item.row.bankPattern, []);
    patterns.get(item.row.bankPattern).push(item);
  }
  const seen = new Set(), translated = [];
  for (const item of rows) {
    const meaningKey = `${item.source}:${item.target}`;
    if (seen.has(meaningKey)) continue;
    seen.add(meaningKey);
    const distractors = chooseDistractors([patterns.get(item.row.bankPattern) || [], categoryItems, items], meanings.get(item.source), item);
    translated.push({ id: item.row.id, text: item.text, answer: item.answer,
      note: item.row.note || "", options: [item.answer, ...distractors] });
  }
  if (practiceCategory === "all" && practiceLevel === "all" && practiceMode === "vocabulary" &&
      learningLanguage === "fr" && answerLanguage === "en" && typeof frenchWords !== "undefined") {
    translated.unshift(...frenchWords.map(word => ({
      id: `original-fr-${encodeURIComponent(word.french.normalize("NFC").trim().toLowerCase())}`,
      text: word.french, answer: word.english, options: word.options
    })));
  }
  return rememberPracticePool(practicePoolCache, key, translated);
}

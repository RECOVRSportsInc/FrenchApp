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
  const library = getPracticeLibrary();
  const categoryRows = library.filter(row => practiceCategory === "all" || categoriesFor(row).includes(practiceCategory));
  const rows = categoryRows.filter(row => practiceLevel === "all" || levelFor(row, practiceMode) === practiceLevel);
  const seen = new Set();
  const translated = [];
  for (const row of rows) {
    const text = questionTextFor(row);
    const answer = translationFor(row, answerLanguage);
    const key = `${normalizeMeaning(text)}:${normalizeMeaning(answer)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const otherMeanings = new Set(library
      .filter(other => normalizeMeaning(questionTextFor(other)) === normalizeMeaning(text))
      .map(other => normalizeMeaning(translationFor(other, answerLanguage))));
    // Prefer the selected category; broaden only if it cannot provide three choices.
    const candidates = [...shuffleOptions(categoryRows), ...shuffleOptions(library)];
    const distractors = [];
    const used = new Set([normalizeMeaning(answer)]);
    for (const other of candidates) {
      const value = translationFor(other, answerLanguage);
      const normalized = normalizeMeaning(value);
      if (used.has(normalized) || otherMeanings.has(normalized)) continue;
      used.add(normalized);
      distractors.push(value);
      if (distractors.length === 3) break;
    }
    translated.push({ id: row.id, text, answer, note: row.note || "",
      options: [answer, ...distractors] });
  }
  if (practiceCategory === "all" && practiceLevel === "all" && practiceMode === "vocabulary" &&
      learningLanguage === "fr" && answerLanguage === "en" && typeof frenchWords !== "undefined") {
    return [...frenchWords.map(word => ({
      id: `original-fr-${encodeURIComponent(word.french.normalize("NFC").trim().toLowerCase())}`,
      text: word.french, answer: word.english, options: word.options
    })), ...translated];
  }
  return translated;
}
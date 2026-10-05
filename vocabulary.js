// Build questions for the selected language pair.

function shuffleOptions(options) {
  const result = [...options];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getActiveWords() {
  const library = practiceMode === "sentences" ? sentences : vocabulary;
  const rows = library.filter(row => practiceLevel === "all" || levelFor(row, practiceMode) === practiceLevel);
  const translated = rows.map(row => {
    const text = translationFor(row, learningLanguage);
    const answer = translationFor(row, answerLanguage);
    const distractors = [...new Set(rows
      .filter(other => other.id !== row.id && translationFor(other, learningLanguage) !== text)
      .map(other => translationFor(other, answerLanguage)))].filter(value => value !== answer);
    return { id: row.id, text, answer, note: row.note || "",
      options: [answer, ...shuffleOptions(distractors).slice(0, 3)] };
  });
  if (practiceLevel === "all" && practiceMode === "vocabulary" && learningLanguage === "fr" && answerLanguage === "en" && typeof frenchWords !== "undefined") {
    return [...frenchWords.map(word => ({ id: `original-fr-${encodeURIComponent(word.french.normalize("NFC").trim().toLowerCase())}`, text: word.french,
      answer: word.english, options: word.options })), ...translated];
  }
  return translated;
}
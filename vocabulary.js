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
  const translated = vocabulary.map(row => {
    const answer = row[answerLanguage];

    const distractors = [
      ...new Set(
        vocabulary
          .filter(other => other.id !== row.id)
          .map(other => other[answerLanguage])
      )
    ].filter(value => value !== answer);

    return {
      id: row.id,
      text: row[learningLanguage],
      answer,
      options: [
        answer,
        ...shuffleOptions(distractors).slice(0, 3)
      ]
    };
  });

  if (
    learningLanguage === "fr" &&
    answerLanguage === "en" &&
    typeof frenchWords !== "undefined"
  ) {
    return [
      ...frenchWords.map((word, i) => ({
        id: `original-fr-${i}`,
        text: word.french,
        answer: word.english,
        options: word.options
      })),
      ...translated
    ];
  }

  return translated;
}
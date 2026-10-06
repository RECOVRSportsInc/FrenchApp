const contentCategories = {
  all: "All categories", work: "Work", healthcare: "Healthcare",
  sports: "Sports", travel: "Travel", home: "Home",
  gym: "Gym / workout", phrases: "Everyday phrases", slang: "Slang & casual"
};
const addedContent = [
  ...workContent, ...healthcareContent, ...sportsContent, ...travelContent,
  ...homeContent, ...gymContent, ...phrasesContent, ...slangContent
];
const legacyCategoryIds = {
  healthcare: ["hand", "foot", "eye", "head", "appointment", "recovery"],
  travel: ["car", "train", "bag", "mobile-phone", "reservation", "money", "receipt"],
  work: ["school", "word", "time", "responsibility", "permission", "explanation", "improvement", "opportunity", "advantage", "consequence"],
  home: ["book", "dog", "cat", "key", "sun", "moon", "day", "night", "morning", "sunset", "friend"]
};
const legacySentenceCategories = {
  home: ["drink-water", "eat-bread", "read-book", "open-door", "close-window", "at-home", "want-coffee", "door-open", "window-closed", "water-cold", "bread-fresh", "book-table", "cat-chair", "if-rain", "closed-although", "left-keys"],
  work: ["go-school", "have-question", "when-finish", "arrive-before"],
  travel: ["train-station", "price", "miss-train", "book-before", "less-expensive"],
  phrases: ["need-help", "not-understand", "learn-french", "explain-again", "since-morning"]
};

function categoriesFor(row) {
  if (row.categories) return row.categories;
  if (["food", "home"].includes(row.topic)) return ["home"];
  if (row.id.startsWith("sentence:")) {
    const id = row.id.slice(9);
    return Object.keys(legacySentenceCategories).filter(key => legacySentenceCategories[key].includes(id));
  }
  return Object.keys(legacyCategoryIds).filter(key => legacyCategoryIds[key].includes(row.id));
}

function getPracticeLibrary() {
  const rows = practiceMode === "sentences" ? sentences : vocabulary;
  return rows.filter(row => !row.sourceLanguage || row.sourceLanguage === learningLanguage);
}

function questionTextFor(row) {
  return row.sourceLanguage ? row.sourceText : translationFor(row, learningLanguage);
}
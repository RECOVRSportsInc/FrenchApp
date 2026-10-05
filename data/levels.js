// App difficulty bands, not certified proficiency or CEFR ratings.
const contentLevels = { all: "All levels", easy: "Easy", medium: "Medium", hard: "Hard" };
const mediumWordIds = new Set([
  "sunset", "money", "time", "morning", "mobile-phone", "kitchen",
  "bathroom", "garden", "juice", "cheese", "rice", "potato"
]);
const easySentenceIds = new Set([
  "sentence:drink-water", "sentence:eat-bread", "sentence:read-book",
  "sentence:open-door", "sentence:close-window", "sentence:at-home",
  "sentence:door-open", "sentence:window-closed", "sentence:water-cold",
  "sentence:bread-fresh"
]);

function levelFor(row, mode) {
  if (row.level) return row.level;
  if (mode === "sentences") return easySentenceIds.has(row.id) ? "easy" : "medium";
  return mediumWordIds.has(row.id) ? "medium" : "easy";
}
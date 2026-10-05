// Shared French is used unless a row has an explicit Canadian variant.
const vocabulary = [...foodVocabulary, ...homeVocabulary, ...everydayVocabulary];
const sentences = [...actionsSentences, ...everydaySentences];
let practiceMode = "vocabulary";
const CONTENT_STORAGE_KEY = "fasttrack_content_mode_v1";

function translationFor(row, language) {
  return language === "frCA" ? (row.frCA || row.fr) : row[language];
}

function initContentControls() {
  try {
    if (localStorage.getItem(CONTENT_STORAGE_KEY) === "sentences") practiceMode = "sentences";
  } catch { /* Vocabulary remains the default. */ }
  const select = document.getElementById("practice-mode");
  if (!select) return;
  select.value = practiceMode;
  select.addEventListener("change", () => {
    if (!appState.tabActive) { select.value = practiceMode; return; }
    practiceMode = select.value === "sentences" ? "sentences" : "vocabulary";
    let failed = false;
    try { localStorage.setItem(CONTENT_STORAGE_KEY, practiceMode); }
    catch { failed = true; }
    appState.previousWord = "";
    loadNextQuestion();
    if (failed) setPracticeStatus("Practice selection could not be saved on this device.");
  });
}
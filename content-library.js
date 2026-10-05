// Shared French is used unless a row has an explicit Canadian variant.
const vocabulary = [...foodVocabulary, ...homeVocabulary, ...everydayVocabulary, ...hardVocabulary];
const sentences = [...actionsSentences, ...everydaySentences, ...hardSentences];
let practiceMode = "vocabulary";
let practiceLevel = "all";
const CONTENT_STORAGE_KEY = "fasttrack_content_mode_v1";
const LEVEL_STORAGE_KEY = "fasttrack_content_level_v1";

function translationFor(row, language) {
  return language === "frCA" ? (row.frCA || row.fr) : row[language];
}

function initContentControls() {
  try {
    if (localStorage.getItem(CONTENT_STORAGE_KEY) === "sentences") practiceMode = "sentences";
    const savedLevel = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (Object.hasOwn(contentLevels, savedLevel)) practiceLevel = savedLevel;
  } catch { /* Defaults remain usable. */ }
  for (const mode of ["vocabulary", "sentences"]) {
    const button = document.getElementById(`mode-${mode}`);
    if (button) button.addEventListener("click", () => selectPractice(mode, practiceLevel));
  }
  const level = document.getElementById("practice-level");
  if (level) level.addEventListener("change", () => selectPractice(practiceMode, level.value));
  updateContentControls();
}

function updateContentControls() {
  for (const mode of ["vocabulary", "sentences"]) {
    const button = document.getElementById(`mode-${mode}`);
    if (button) button.setAttribute("aria-pressed", String(mode === practiceMode));
  }
  const level = document.getElementById("practice-level");
  if (level) level.value = practiceLevel;
  const label = document.getElementById("practice-label");
  if (label) label.textContent = `${practiceMode === "sentences" ? "Sentence" : "Word"} practice`;
}

function selectPractice(mode, level) {
  if (!appState.tabActive || appState.switchingCode) { updateContentControls(); return; }
  if (!["vocabulary", "sentences"].includes(mode) || !Object.hasOwn(contentLevels, level)) return;
  practiceMode = mode;
  practiceLevel = level;
  let failed = false;
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, practiceMode);
    localStorage.setItem(LEVEL_STORAGE_KEY, practiceLevel);
  } catch { failed = true; }
  appState.previousWord = "";
  updateContentControls();
  loadNextQuestion();
  if (failed) setPracticeStatus("Practice selection could not be saved on this device.");
}
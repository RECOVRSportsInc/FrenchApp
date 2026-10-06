// Shared French is used unless a row has an explicit Canadian variant.
const vocabulary = [...foodVocabulary, ...homeVocabulary, ...everydayVocabulary, ...hardVocabulary, ...addedContent.filter(row => row.mode === "vocabulary")];
const sentences = [...actionsSentences, ...everydaySentences, ...hardSentences, ...addedContent.filter(row => row.mode === "sentences")];
let practiceMode = "vocabulary";
let practiceLevel = "all";
let practiceCategory = "all";
const CONTENT_STORAGE_KEY = "fasttrack_content_mode_v1";
const CATEGORY_STORAGE_KEY = "fasttrack_content_category_v1";
const LEVEL_STORAGE_KEY = "fasttrack_content_level_v1";

function translationFor(row, language) {
  return language === "frCA" ? (row.frCA || row.fr) : row[language];
}

function initContentControls() {
  try {
    if (localStorage.getItem(CONTENT_STORAGE_KEY) === "sentences") practiceMode = "sentences";
    const savedCategory = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (Object.hasOwn(contentCategories, savedCategory)) practiceCategory = savedCategory;
    const savedLevel = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (Object.hasOwn(contentLevels, savedLevel)) practiceLevel = savedLevel;
  } catch { /* Defaults remain usable. */ }
  for (const mode of ["vocabulary", "sentences"]) {
    const button = document.getElementById(`mode-${mode}`);
    if (button) button.addEventListener("click", () => selectPractice(mode, practiceLevel));
  }
  const level = document.getElementById("practice-level");
  if (level) level.addEventListener("change", () => selectPractice(practiceMode, level.value));
  const category = document.getElementById("practice-category");
  if (category) {
    category.replaceChildren();
    for (const [value, name] of Object.entries(contentCategories)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      category.appendChild(option);
    }
    category.addEventListener("change", () => selectPractice(practiceMode, practiceLevel, category.value));
  }
  updateContentControls();
}

function updateContentControls() {
  for (const mode of ["vocabulary", "sentences"]) {
    const button = document.getElementById(`mode-${mode}`);
    if (button) button.setAttribute("aria-pressed", String(mode === practiceMode));
  }
  const level = document.getElementById("practice-level");
  if (level) level.value = practiceLevel;
  const category = document.getElementById("practice-category");
  if (category) {
    category.value = practiceCategory;
    for (const option of category.children) {
      if (option.value === "slang") option.textContent = learningLanguage === "ar"
        ? "Everyday expressions (MSA)" : contentCategories.slang;
    }
  }
  const label = document.getElementById("practice-label");
  if (label) label.textContent = `${practiceMode === "sentences" ? "Sentence" : "Word"} practice`;
}

function selectPractice(mode, level, category = practiceCategory) {
  if (!appState.tabActive || appState.switchingCode) { updateContentControls(); return; }
  if (!["vocabulary", "sentences"].includes(mode) || !Object.hasOwn(contentLevels, level) || !Object.hasOwn(contentCategories, category)) return;
  practiceMode = mode;
  practiceLevel = level;
  practiceCategory = category;
  let failed = false;
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, practiceMode);
    localStorage.setItem(LEVEL_STORAGE_KEY, practiceLevel);
    localStorage.setItem(CATEGORY_STORAGE_KEY, practiceCategory);
  } catch { failed = true; }
  appState.previousWord = "";
  updateContentControls();
  loadNextQuestion();
  if (failed) setPracticeStatus("Practice selection could not be saved on this device.");
}
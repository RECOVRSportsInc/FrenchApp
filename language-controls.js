const LANGUAGE_STORAGE_KEY = "fasttrack_language_preferences_v1";
let learningLanguage = "fr";
let answerLanguage = "en";
let languageControlsReady = false;

function initLanguageControls() {
  if (languageControlsReady) return;
  languageControlsReady = true;
  try {
    const saved = JSON.parse(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "null");
    if (saved && languageCatalog[saved.learning] && languageCatalog[saved.answers] && !sameLanguageFamily(saved.learning, saved.answers)) {
      learningLanguage = saved.learning;
      answerLanguage = saved.answers;
    }
  } catch { /* Defaults remain usable if preferences cannot be read. */ }
  for (const id of ["learning-language", "answer-language"]) {
    const select = document.getElementById(id);
    if (!select) continue;
    select.replaceChildren();
    for (const [code, language] of Object.entries(languageCatalog)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${language.name} · ${language.native}`;
      select.appendChild(option);
    }
    select.addEventListener("change", () => changeLanguage(id));
  }
  initContentControls();
  updateLanguageControls();
}

function updateLanguageControls() {
  updateContentControls();
  const learning = document.getElementById("learning-language");
  const answers = document.getElementById("answer-language");
  if (learning) learning.value = learningLanguage;
  if (answers) answers.value = answerLanguage;
  const pair = document.getElementById("language-pair");
  if (pair) pair.textContent = `${languageCatalog[learningLanguage].name} → ${languageCatalog[answerLanguage].name}`;
  const instruction = document.getElementById("question-instruction");
  if (instruction) instruction.textContent = `Choose the ${languageCatalog[answerLanguage].name} meaning`;
  const listen = document.getElementById("listen-button");
  if (listen) listen.setAttribute("aria-label", `Listen to the ${languageCatalog[learningLanguage].name} pronunciation`);
}

function changeLanguage(changedId) {
  if (!appState.tabActive) return;
  const selected = document.getElementById(changedId).value;
  if (!languageCatalog[selected]) return;
  if (changedId === "learning-language") {
    learningLanguage = selected;
    if (sameLanguageFamily(answerLanguage, selected)) answerLanguage = selected === "en" ? "fr" : "en";
  } else {
    answerLanguage = selected;
    if (sameLanguageFamily(learningLanguage, selected)) learningLanguage = languageCatalog[selected].family === "fr" ? "en" : "fr";
  }
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify({ learning: learningLanguage, answers: answerLanguage }));
  } catch { setPracticeStatus("Language selection could not be saved on this device."); }
  appState.previousWord = "";
  updateLanguageControls();
  loadNextQuestion();
}
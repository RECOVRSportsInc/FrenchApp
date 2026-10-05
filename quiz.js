let questionVersion = 0;

function setPracticeStatus(message) {
  const element = document.getElementById("practice-status");
  if (element) element.textContent = message;
}

function loadNextQuestion() {
  clearTimeout(appState.nextQuestionTimer);
  initLanguageControls();
  questionVersion++;
  setPracticeStatus("");
  const words = getActiveWords();
  const remaining = words.filter(word => word.id !== appState.previousWord);
  const pool = remaining.length ? remaining : words;
  const container = document.getElementById("options-container");
  const display = document.getElementById("word-display");
  if (!container || !display) return;
  if (!pool.length) {
    appState.currentWord = { text: "" };
    display.textContent = "No questions available";
    container.replaceChildren();
    setPracticeStatus("Choose another level or practice type.");
    return;
  }
  const question = pool[Math.floor(Math.random() * pool.length)];
  const version = questionVersion;
  appState.currentWord = question;
  appState.previousWord = question.id;
  display.textContent = question.text;
  const note = document.getElementById("content-note");
  if (note) note.textContent = question.note || "";
  display.lang = languageCatalog[learningLanguage].speech;
  display.dir = languageCatalog[learningLanguage].direction;
  container.replaceChildren();
  container.setAttribute("aria-label", `${languageCatalog[answerLanguage].name} answer choices`);
  for (const option of shuffleOptions(question.options)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn";
    const label = document.createElement("span");
    label.textContent = option;
    label.lang = languageCatalog[answerLanguage].speech;
    label.dir = languageCatalog[answerLanguage].direction;
    button.appendChild(label);
    button.onclick = () => checkAnswer(button, option, version);
    container.appendChild(button);
  }
  const size = document.getElementById("word-count");
  if (size) size.textContent = `${words.length} ${practiceMode === "sentences" ? "sentences" : "words"} · ${contentLevels[practiceLevel]}`;
  renderWordProgress();
  speakWord();
}

function checkAnswer(button, selectedOption, version = questionVersion) {
  if (!appState.tabActive || appState.switchingCode || version !== questionVersion || button.disabled) return;
  const previousXP = appState.xp;
  recordWordAnswer(appState.currentWord, selectedOption === appState.currentWord.answer);
  if (selectedOption === appState.currentWord.answer) {
    button.classList.add("correct");
    appState.xp += 10;
    document.querySelectorAll("#options-container .btn").forEach(btn => { btn.disabled = true; });
    setPracticeStatus("Correct! +10 XP");
    appState.nextQuestionTimer = setTimeout(loadNextQuestion, 1000);
  } else {
    button.classList.add("wrong");
    button.disabled = true;
    appState.xp = Math.max(0, appState.xp - 5);
    setPracticeStatus("Try another answer.");
  }
  appState.pendingXP += appState.xp - previousXP;
  saveLocally();
  autoSyncToCloud();
}
let questionVersion = 0;

function setPracticeStatus(message) {
  const element = document.getElementById("practice-status");
  if (element) element.textContent = message;
}

function loadNextQuestion() {
  clearTimeout(appState.nextQuestionTimer);
  initLanguageControls();
  questionVersion++;
  window.speechSynthesis?.cancel();
  if (typeof practiceSession !== "undefined" && practiceSession && practiceSession.selection !== sessionSelection()) endPracticeRound();
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
    const note = document.getElementById("content-note");
    if (note) note.textContent = "";
    const count = document.getElementById("word-count");
    if (count) count.textContent = "0 questions";
    renderWordProgress();
    setPracticeStatus("Choose another category, level or practice type.");
    return;
  }
  const roundQuestion = typeof nextSessionQuestion === "function" ? nextSessionQuestion(pool) : null;
  if (roundQuestion === false) return;
  const question = roundQuestion || pool[Math.floor(Math.random() * pool.length)];
  const version = questionVersion;
  appState.currentWord = question;
  appState.previousWord = question.id;
  container.classList?.toggle?.('course-free-response', Boolean(question.task));
  if (question.task) {
    const instruction = document.getElementById('question-instruction');
    if (instruction) instruction.textContent = question.task.kind === 'choice' ? `Choose the ${languageCatalog[question.task.responseLanguage].name} answer` : question.task.kind === 'recall' ? 'Recall the word or expression' : 'Rebuild the taught sentence';
    display.textContent = question.task.prompt;
    display.lang = languageCatalog[question.task.promptLanguage].speech;
    display.dir = languageCatalog[question.task.promptLanguage].direction;
    renderCourseTask(container, question.task, response => {
      if (!appState.tabActive || appState.switchingCode || version !== questionVersion || question.responseRecorded || question !== appState.currentWord) return;
      const correct = gradeCourseTask(question.task, response);
      if (correct || (typeof practiceSession !== "undefined" && practiceSession)) question.responseRecorded = true;
      const button = { disabled: false, classList: { add() {} } };
      checkAnswer(button, correct ? question.answer : `Wrong response: ${response}`, version);
    });
  } else {
    display.textContent = question.text;
    display.lang = languageCatalog[learningLanguage].speech;
    display.dir = languageCatalog[learningLanguage].direction;
    container.replaceChildren();
    for (const option of shuffleOptions(question.options)) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn';
      const label = document.createElement('span'); label.textContent = option; button.appendChild(label); button.onclick = () => checkAnswer(button, option, version); container.appendChild(button);
    }
  }
  const note = document.getElementById('content-note');
  if (note) note.textContent = typeof practiceSession !== 'undefined' && practiceSession ? 'Usage note appears after your answer.' : question.note || '';
  const size = document.getElementById("word-count");
  if (size) size.textContent = `${words.length} ${practiceMode === "sentences" ? "sentences" : "words"} · ${contentLevels[practiceLevel]}`;
  renderWordProgress();
  if (typeof refreshVoiceOptions === "function") refreshVoiceOptions();
  if (typeof speechAutoPlay === "function" && speechAutoPlay() && (!question.task || question.task.tier === "easy") && document.body?.dataset.learningView !== "conversations") speakWord();
}

function checkAnswer(button, selectedOption, version = questionVersion) {
  if (!appState.tabActive || appState.switchingCode || version !== questionVersion || button.disabled) return;
  if (typeof practiceSession !== "undefined" && practiceSession && practiceSession.answered) return;
  if (typeof practiceSession !== "undefined" && practiceSession && practiceSession.selection !== sessionSelection()) { endPracticeRound(); loadNextQuestion(); return; }
  const previousXP = appState.xp;
  recordWordAnswer(appState.currentWord, selectedOption === appState.currentWord.answer);
  if (selectedOption === appState.currentWord.answer) {
    button.classList.add("correct");
    appState.xp += 10;
    document.querySelectorAll("#options-container button, #options-container input").forEach(btn => { btn.disabled = true; });
    setPracticeStatus("Correct! +10 XP");
    if (typeof practiceSession === "undefined" || !practiceSession) appState.nextQuestionTimer = setTimeout(loadNextQuestion, 1000);
  } else {
    button.classList.add("wrong");
    button.disabled = true;
    appState.xp = Math.max(0, appState.xp - 5);
    setPracticeStatus("Try another answer.");
  }
  if (typeof practiceSession !== "undefined" && practiceSession) {
    const correct = selectedOption === appState.currentWord.answer;
    answerPracticeRound(correct);
    const note = document.getElementById("content-note");
    if (note) note.textContent = appState.currentWord.note || "";
    document.querySelectorAll("#options-container button, #options-container input").forEach(btn => { btn.disabled = true; });
    if (!correct) setPracticeStatus(`Expected taught form: ${appState.currentWord.task?.answer || appState.currentWord.answer}`);
    appState.nextQuestionTimer = setTimeout(loadNextQuestion, correct ? 1000 : 2500);
  }
  appState.pendingXP += appState.xp - previousXP;
  saveLocally();
  autoSyncToCloud();
}
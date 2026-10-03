const LANGUAGE_STORAGE_KEY = "fasttrack_language_preferences_v1";
let learningLanguage = "fr";
let answerLanguage = "en";
let languageControlsReady = false;
let questionVersion = 0;

function shuffleOptions(options) {
  const result = [...options];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function setPracticeStatus(message) {
  const element = document.getElementById("practice-status");

  if (element) {
    element.textContent = message;
  }
}

function initLanguageControls() {
  if (languageControlsReady) return;
  languageControlsReady = true;

  try {
    const saved = JSON.parse(
      localStorage.getItem(LANGUAGE_STORAGE_KEY) || "null"
    );

    if (
      saved &&
      languageCatalog[saved.learning] &&
      languageCatalog[saved.answers] &&
      saved.learning !== saved.answers
    ) {
      learningLanguage = saved.learning;
      answerLanguage = saved.answers;
    }
  } catch {
    // Defaults remain usable if preferences cannot be read.
  }

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

  updateLanguageControls();
}

function updateLanguageControls() {
  const learning = document.getElementById("learning-language");
  const answers = document.getElementById("answer-language");

  if (learning) learning.value = learningLanguage;
  if (answers) answers.value = answerLanguage;

  const pair = document.getElementById("language-pair");

  if (pair) {
    pair.textContent =
      `${languageCatalog[learningLanguage].name} → ` +
      languageCatalog[answerLanguage].name;
  }

  const instruction = document.getElementById("question-instruction");

  if (instruction) {
    instruction.textContent =
      `Choose the ${languageCatalog[answerLanguage].name} meaning`;
  }

  const listen = document.getElementById("listen-button");

  if (listen) {
    listen.setAttribute(
      "aria-label",
      `Listen to the ${languageCatalog[learningLanguage].name} pronunciation`
    );
  }
}

function changeLanguage(changedId) {
  if (!appState.tabActive) return;

  const selected = document.getElementById(changedId).value;
  if (!languageCatalog[selected]) return;

  if (changedId === "learning-language") {
    learningLanguage = selected;

    if (answerLanguage === selected) {
      answerLanguage = selected === "en" ? "fr" : "en";
    }
  } else {
    answerLanguage = selected;

    if (learningLanguage === selected) {
      learningLanguage = selected === "fr" ? "en" : "fr";
    }
  }

  try {
    localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      JSON.stringify({
        learning: learningLanguage,
        answers: answerLanguage
      })
    );
  } catch {
    setPracticeStatus(
      "Language selection could not be saved on this device."
    );
  }

  appState.previousWord = "";
  updateLanguageControls();
  loadNextQuestion();
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

function loadNextQuestion() {
  clearTimeout(appState.nextQuestionTimer);
  initLanguageControls();
  questionVersion++;
  setPracticeStatus("");

  const words = getActiveWords();

  const remaining = words.filter(
    word => word.id !== appState.previousWord
  );

  const pool = remaining.length ? remaining : words;
  const container = document.getElementById("options-container");
  const display = document.getElementById("word-display");

  if (!pool.length || !container || !display) return;

  const question = pool[Math.floor(Math.random() * pool.length)];
  const version = questionVersion;

  appState.currentWord = question;
  appState.previousWord = question.id;

  display.textContent = question.text;
  display.lang = learningLanguage;
  display.dir = languageCatalog[learningLanguage].direction;

  container.replaceChildren();

  container.setAttribute(
    "aria-label",
    `${languageCatalog[answerLanguage].name} answer choices`
  );

  for (const option of shuffleOptions(question.options)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn";

    const label = document.createElement("span");
    label.textContent = option;
    label.lang = answerLanguage;
    label.dir = languageCatalog[answerLanguage].direction;

    button.appendChild(label);

    button.onclick = () => {
      checkAnswer(button, option, version);
    };

    container.appendChild(button);
  }

  const size = document.getElementById("word-count");

  if (size) {
    size.textContent = `${words.length} words`;
  }

  speakWord();
}

function checkAnswer(
  button,
  selectedOption,
  version = questionVersion
) {
  if (
    !appState.tabActive ||
    appState.switchingCode ||
    version !== questionVersion ||
    button.disabled
  ) {
    return;
  }

  const previousXP = appState.xp;

  if (selectedOption === appState.currentWord.answer) {
    button.classList.add("correct");
    appState.xp += 10;

    document
      .querySelectorAll("#options-container .btn")
      .forEach(btn => {
        btn.disabled = true;
      });

    setPracticeStatus("Correct! +10 XP");

    appState.nextQuestionTimer = setTimeout(
      loadNextQuestion,
      1000
    );
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

function speakWord() {
  if (!appState.currentWord.text) return;

  if (!("speechSynthesis" in window)) {
    setPracticeStatus(
      "Pronunciation is unavailable in this browser."
    );
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      appState.currentWord.text
    );

    utterance.lang = languageCatalog[learningLanguage].speech;

    const voices = window.speechSynthesis.getVoices();

    const voice =
      voices.find(
        v => v.lang.toLowerCase() === utterance.lang.toLowerCase()
      ) ||
      voices.find(
        v => v.lang.toLowerCase().split("-")[0] === learningLanguage
      );

    if (voice) {
      utterance.voice = voice;
    }

    const speakingVersion = questionVersion;

    utterance.onerror = event => {
      if (speakingVersion !== questionVersion) return;
      if (["canceled", "interrupted"].includes(event.error)) return;

      setPracticeStatus(
        "Pronunciation unavailable. You may need to add " +
        "this language's voice in your device settings."
      );
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    setPracticeStatus(
      "Pronunciation is unavailable on this device."
    );
  }
}
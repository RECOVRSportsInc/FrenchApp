function shuffleOptions(options) {
  const shuffled = [...options];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function loadNextQuestion() {
  clearTimeout(appState.nextQuestionTimer);

  if (
    typeof frenchWords === "undefined" ||
    !Array.isArray(frenchWords) ||
    frenchWords.length === 0
  ) {
    const wordDisplay = document.getElementById("word-display");

    if (wordDisplay) {
      wordDisplay.textContent = "No words available";
    }

    console.error(
      "words.js must define a non-empty array named frenchWords."
    );
    return;
  }

  const alternatives = frenchWords.filter(
    word => word.french !== appState.previousWord
  );

  const availableWords =
    alternatives.length > 0 ? alternatives : frenchWords;

  appState.currentWord =
    availableWords[Math.floor(Math.random() * availableWords.length)];

  appState.previousWord = appState.currentWord.french;

  const wordDisplay = document.getElementById("word-display");

  if (wordDisplay) {
    wordDisplay.textContent = appState.currentWord.french;
  }

  const container = document.getElementById("options-container");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  shuffleOptions(appState.currentWord.options).forEach(option => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn";
    button.textContent = option;
    button.onclick = () => checkAnswer(button, option);

    container.appendChild(button);
  });

  speakWord();
}

function checkAnswer(button, selectedOption) {
  if (
    !appState.tabActive ||
    appState.switchingCode ||
    button.disabled ||
    button.classList.contains("wrong")
  ) {
    return;
  }

  const previousXP = appState.xp;

  if (selectedOption === appState.currentWord.english) {
    button.classList.add("correct");
    appState.xp += 10;

    document
      .querySelectorAll("#options-container .btn")
      .forEach(btn => {
        btn.disabled = true;
      });

    appState.nextQuestionTimer = setTimeout(loadNextQuestion, 1000);
  } else {
    button.classList.add("wrong");
    button.disabled = true;

    appState.xp = Math.max(0, appState.xp - 5);
  }

  appState.pendingXP += appState.xp - previousXP;

  saveLocally();
  autoSyncToCloud();
}

function speakWord() {
  if (!("speechSynthesis" in window) || !appState.currentWord.french) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(appState.currentWord.french);
  utterance.lang = "fr-FR";

  try { window.speechSynthesis.speak(utterance); } catch (error) { console.warn("Pronunciation unavailable:", error.message); }
}

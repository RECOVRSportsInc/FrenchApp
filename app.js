const APP_PREFIX = "frenchfasttrack_v2";
const API_BASE = "https://countapi.mileshilliard.com/api/v1";

let currentWord = {};
let previousWord = "";
let saveQueue = Promise.resolve();
let uploadInProgress = false;

const storedXP = Number(localStorage.getItem("frenchXP"));
let xp = Number.isSafeInteger(storedXP) && storedXP >= 0
  ? storedXP
  : 0;

let syncCode =
  localStorage.getItem("frenchSyncCode") || generateSyncCode();

document.getElementById("xp").innerText = xp;
document.getElementById("sync-code-display").innerText = syncCode;

function generateSyncCode() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  localStorage.setItem("frenchSyncCode", code);
  return code;
}

function saveLocally() {
  localStorage.setItem("frenchXP", String(xp));
  localStorage.setItem("frenchSyncCode", syncCode);

  document.getElementById("xp").innerText = xp;
  document.getElementById("sync-code-display").innerText = syncCode;
}

function shuffleOptions(options) {
  const shuffled = [...options];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function loadNextQuestion() {
  if (
    typeof frenchWords === "undefined" ||
    !Array.isArray(frenchWords) ||
    frenchWords.length === 0
  ) {
    document.getElementById("word-display").innerText =
      "No words available";

    console.error(
      "words.js must define a non-empty array named frenchWords."
    );
    return;
  }

  const alternatives = frenchWords.filter(
    word => word.french !== previousWord
  );

  const availableWords =
    alternatives.length > 0 ? alternatives : frenchWords;

  currentWord =
    availableWords[Math.floor(Math.random() * availableWords.length)];

  previousWord = currentWord.french;

  document.getElementById("word-display").innerText =
    currentWord.french;

  const optionsContainer =
    document.getElementById("options-container");

  optionsContainer.innerHTML = "";

  shuffleOptions(currentWord.options).forEach(option => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn";
    button.innerText = option;
    button.onclick = () => checkAnswer(button, option);

    optionsContainer.appendChild(button);
  });

  speakWord();
}

function checkAnswer(button, selectedOption) {
  if (button.disabled || button.classList.contains("wrong")) {
    return;
  }

  if (selectedOption === currentWord.english) {
    button.classList.add("correct");
    xp += 10;

    document
      .querySelectorAll("#options-container .btn")
      .forEach(btn => {
        btn.disabled = true;
      });

    saveLocally();
    autoSyncToCloud();

    setTimeout(loadNextQuestion, 1000);
  } else {
    button.classList.add("wrong");
    button.disabled = true;

    xp = Math.max(0, xp - 5);

    saveLocally();
    autoSyncToCloud();
  }
}

function speakWord() {
  if (!("speechSynthesis" in window) || !currentWord.french) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(currentWord.french);

  utterance.lang = "fr-FR";
  window.speechSynthesis.speak(utterance);
}

async function requestCloud(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    const body = await response.text();
    let data;

    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(
        `HTTP ${response.status}: the server returned a non-JSON response.`
      );
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ` +
        (data.error || data.message || "Cloud request failed.")
      );
    }

    if (data.error) {
      throw new Error(String(data.error));
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The cloud service did not respond within 15 seconds."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCloudXP(value) {
  if (
    value === undefined ||
    value === null ||
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    throw new Error("The cloud service returned an invalid XP value.");
  }

  const parsedXP = Number(value);

  if (!Number.isSafeInteger(parsedXP) || parsedXP < 0) {
    throw new Error("The cloud service returned an invalid XP value.");
  }

  return parsedXP;
}

async function saveToCloud(codeToSave, xpToSave) {
  if (!Number.isSafeInteger(xpToSave) || xpToSave < 0) {
    throw new Error("XP must be a valid non-negative integer.");
  }

  const key =
    encodeURIComponent(`${APP_PREFIX}_${codeToSave}`);

  const data = await requestCloud(
    `${API_BASE}/set/${key}?value=${xpToSave}`
  );

  if (parseCloudXP(data.value) !== xpToSave) {
    throw new Error(
      "The server did not confirm the expected XP value."
    );
  }

  return true;
}

// Send saves in order so an older request cannot finish after a newer one.
function queueCloudSave(codeToSave, xpToSave) {
  const pendingSave = saveQueue.then(() =>
    saveToCloud(codeToSave, xpToSave)
  );

  // A failed request must not block subsequent saves.
  saveQueue = pendingSave.catch(() => {});

  return pendingSave;
}

async function uploadProgress() {
  if (uploadInProgress) {
    return;
  }

  uploadInProgress = true;

  const codeToSave = syncCode;
  const xpToSave = xp;

  try {
    await queueCloudSave(codeToSave, xpToSave);

    alert(
      `Progress saved: ${xpToSave} XP under code ${codeToSave}`
    );
  } catch (error) {
    console.error("Cloud save failed:", error);

    alert(
      `Cloud save failed: ${error.message}\n\n` +
      "Your XP is still saved on this device."
    );
  } finally {
    uploadInProgress = false;
  }
}

async function autoSyncToCloud() {
  try {
    await queueCloudSave(syncCode, xp);
  } catch (error) {
    console.warn("Automatic cloud save failed:", error.message);
  }
}

async function promptSyncCode() {
  const enteredCode = prompt(
    "Enter your 4-digit Sync Code from your other device:"
  );

  if (enteredCode === null) {
    return;
  }

  const cleanCode = enteredCode.trim();

  if (!/^\d{4}$/.test(cleanCode)) {
    alert("Please enter a valid 4-digit code.");
    return;
  }

  const key =
    encodeURIComponent(`${APP_PREFIX}_${cleanCode}`);

  try {
    const data = await requestCloud(`${API_BASE}/get/${key}`);
    const fetchedXP = parseCloudXP(data.value);

    xp = fetchedXP;
    syncCode = cleanCode;

    saveLocally();

    alert(
      `Successfully loaded ${xp} XP from code ${syncCode}!`
    );
  } catch (error) {
    console.error("Cloud load failed:", error);

    alert(`Could not load cloud progress: ${error.message}`);
  }
}

loadNextQuestion();
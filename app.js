let currentWord = {};
let previousWord = "";
let xp = localStorage.getItem('frenchXP') ? parseInt(localStorage.getItem('frenchXP')) : 0;
let syncCode = localStorage.getItem('frenchSyncCode') || generateSyncCode();

// Unique prefix for your app sync keys
const APP_PREFIX = "frenchfasttrack_v2";

document.getElementById('xp').innerText = xp;
document.getElementById('sync-code-display').innerText = syncCode;

function generateSyncCode() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  localStorage.setItem('frenchSyncCode', code);
  return code;
}

function loadNextQuestion() {
  let newWord;
  
  // Prevent repeating the same word back-to-back
  do {
    newWord = frenchWords[Math.floor(Math.random() * frenchWords.length)];
  } while (newWord.french === previousWord && frenchWords.length > 1);

  currentWord = newWord;
  previousWord = currentWord.french;

  document.getElementById('word-display').innerText = currentWord.french;
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  // Shuffle options
  const shuffledOptions = [...currentWord.options].sort(() => Math.random() - 0.5);

  shuffledOptions.forEach(option => {
    const button = document.createElement('button');
    button.className = 'btn';
    button.innerText = option;
    button.onclick = () => checkAnswer(button, option);
    optionsContainer.appendChild(button);
  });

  speakWord();
}

function checkAnswer(button, selectedOption) {
  if (button.classList.contains('wrong') || button.disabled) return;

  if (selectedOption === currentWord.english) {
    button.classList.add('correct');
    
    // Reward: +10 XP
    xp += 10;
    localStorage.setItem('frenchXP', xp);
    document.getElementById('xp').innerText = xp;

    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => btn.disabled = true);

    autoSyncToCloud();
    setTimeout(loadNextQuestion, 1000);

  } else {
    button.classList.add('wrong');
    button.disabled = true;

    // Penalty: -5 XP (Minimum XP is 0)
    xp = Math.max(0, xp - 5);
    localStorage.setItem('frenchXP', xp);
    document.getElementById('xp').innerText = xp;

    autoSyncToCloud();
  }
}

function speakWord() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.french);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
  }
}

// Cloud Sync via open CountAPI
async function saveToCloud(codeToSave, xpToSave) {
  const key = `${APP_PREFIX}_${codeToSave}`;
  const response = await fetch(`https://countapi.mileshilliard.com/api/v1/set/${key}?value=${xpToSave}`);
  return response.ok;
}

async function uploadProgress() {
  try {
    const success = await saveToCloud(syncCode, xp);
    if (success) {
      alert(`Progress saved to cloud under code: ${syncCode}`);
    } else {
      alert(`Save failed for code: ${syncCode}`);
    }
  } catch (error) {
    alert("Cloud save error: " + error.message);
  }
}

async function autoSyncToCloud() {
  try {
    await saveToCloud(syncCode, xp);
  } catch (e) {
    // Silent fail on background auto-sync
  }
}

async function promptSyncCode() {
  const enteredCode = prompt("Enter your 4-digit Sync Code from your other device:");
  if (!enteredCode || enteredCode.trim().length !== 4) {
    if (enteredCode) alert("Please enter a valid 4-digit code.");
    return;
  }

  const cleanCode = enteredCode.trim();
  const key = `${APP_PREFIX}_${cleanCode}`;
  
  try {
    const response = await fetch(`https://countapi.mileshilliard.com/api/v1/get/${key}`);
    if (!response.ok) {
      alert("No cloud save found for code: " + cleanCode);
      return;
    }

    const data = await response.json();
    const fetchedXP = parseInt(data.value);

    if (!isNaN(fetchedXP)) {
      xp = fetchedXP;
      syncCode = cleanCode;

      localStorage.setItem('frenchXP', xp);
      localStorage.setItem('frenchSyncCode', syncCode);

      document.getElementById('xp').innerText = xp;
      document.getElementById('sync-code-display').innerText = syncCode;

      alert(`Successfully loaded ${xp} XP from code ${syncCode}!`);
    } else {
      alert("No cloud save found for code: " + cleanCode);
    }
  } catch (error) {
    alert("Error fetching sync data: " + error.message);
  }
}

// Initialize on page load
loadNextQuestion();
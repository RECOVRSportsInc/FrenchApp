// Only matching-language device voices are offered. No English fallback for Arabic.
const VOICE_STORAGE_KEY = 'fasttrack_voice_preferences_v1';
let voicePreferences = { voices: {}, autoplay: false };
try {
  const saved = JSON.parse(localStorage.getItem(VOICE_STORAGE_KEY) || 'null');
  if (saved && saved.voices && typeof saved.voices === 'object')
    voicePreferences = { voices: saved.voices, autoplay: saved.autoplay === true };
} catch { /* Defaults remain usable. */ }
function saveVoicePreferences() {
  try { localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(voicePreferences)); }
  catch { setPracticeStatus('Voice preferences could not be saved on this device.'); }
}
function speechAutoPlay() { return voicePreferences.autoplay; }
function matchingVoices() {
  if (!('speechSynthesis' in window)) return [];
  const locale = languageCatalog[learningLanguage].speech.toLowerCase();
  return window.speechSynthesis.getVoices()
    .filter(voice => voice.lang.toLowerCase().split('-')[0] === locale.split('-')[0])
    .sort((a, b) => Number(b.lang.toLowerCase() === locale) - Number(a.lang.toLowerCase() === locale));
}
function refreshVoiceOptions() {
  const select = document.getElementById('voice-choice');
  if (!select) return;
  const voices = matchingVoices();
  select.replaceChildren();
  for (const voice of voices) {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} (${voice.lang})`;
    select.appendChild(option);
  }
  const preferred = voicePreferences.voices[learningLanguage];
  select.value = voices.some(voice => voice.voiceURI === preferred) ? preferred : voices[0]?.voiceURI || '';
  select.disabled = !voices.length;
  const help = document.getElementById('voice-help');
  if (help) help.textContent = voices.length
    ? 'Preview the voices and choose the clearest one. Voice quality depends on your device.'
    : 'No matching voice is available yet. Add a voice for this language in your device settings, then reload.';
}
function speakWord(slow = false) {
  if (!appState.currentWord.text) return;
  if (!('speechSynthesis' in window)) { setPracticeStatus('Pronunciation is unavailable in this browser.'); return; }
  const voices = matchingVoices();
  const selected = document.getElementById('voice-choice')?.value || voicePreferences.voices[learningLanguage];
  const voice = voices.find(item => item.voiceURI === selected) || voices[0];
  if (!voice) { refreshVoiceOptions(); setPracticeStatus('No matching voice is available. Try again after voices load or add a language voice on your device.'); return; }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(appState.currentWord.text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = slow ? 0.75 : 1;
    const version = questionVersion;
    utterance.onerror = event => {
      if (version !== questionVersion || ['canceled', 'interrupted'].includes(event.error)) return;
      setPracticeStatus('Pronunciation unavailable. Try another matching voice.');
    };
    window.speechSynthesis.speak(utterance);
  } catch { setPracticeStatus('Pronunciation is unavailable on this device.'); }
}
function initSpeechControls() {
  const panel = document.createElement('div');
  panel.className = 'voice-controls';
  panel.innerHTML = '<label for="voice-choice">Voice</label><select id="voice-choice" aria-describedby="voice-help"></select><button type="button" id="listen-slow">Listen slowly</button><label><input type="checkbox" id="voice-autoplay"> Auto-play</label><p id="voice-help" class="voice-help"></p>';
  document.getElementById('listen-button').after(panel);
  document.getElementById('voice-choice').onchange = event => {
    voicePreferences.voices[learningLanguage] = event.target.value;
    saveVoicePreferences();
    speakWord();
  };
  document.getElementById('listen-slow').onclick = () => speakWord(true);
  const autoplay = document.getElementById('voice-autoplay');
  autoplay.checked = voicePreferences.autoplay;
  autoplay.onchange = () => { voicePreferences.autoplay = autoplay.checked; saveVoicePreferences(); };
  window.speechSynthesis?.addEventListener('voiceschanged', refreshVoiceOptions);
  refreshVoiceOptions();
}

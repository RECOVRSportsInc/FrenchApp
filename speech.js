// Pronunciation uses a voice for the selected learning language.

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
// A round captures its selection so changing filters cannot mix results.
let practiceSession = null;
function sessionSelection() {
  return [appState.syncCode, learningLanguage, answerLanguage, practiceMode, practiceCategory, practiceLevel].join(':');
}
function startPracticeRound(retry = false) {
  if (!appState.tabActive || appState.switchingCode) return;
  const selection = sessionSelection();
  const pool = retry && practiceSession && practiceSession.selection === selection
    ? practiceSession.missed : getActiveWords();
  const queue = shuffleOptions(pool).slice(0, 10);
  if (!queue.length) { setPracticeStatus('No questions available for this selection.'); return; }
  practiceSession = { selection, queue, index: 0, correct: 0, missed: [], streak: 0, bestStreak: 0, answered: false, retry };
  if (typeof showLearningView === 'function') showLearningView('practice');
  loadNextQuestion();
}
function nextSessionQuestion(pool) {
  if (!practiceSession) return null;
  if (practiceSession.selection !== sessionSelection()) { endPracticeRound(); return null; }
  if (practiceSession.index >= practiceSession.queue.length) {
    finishPracticeRound();
    return false;
  }
  practiceSession.answered = false;
  renderPracticeRound();
  return practiceSession.queue[practiceSession.index];
}
function answerPracticeRound(correct) {
  if (!practiceSession || practiceSession.answered) return false;
  practiceSession.answered = true;
  if (correct) {
    practiceSession.correct++;
    practiceSession.streak++;
    practiceSession.bestStreak = Math.max(practiceSession.bestStreak, practiceSession.streak);
  } else {
    practiceSession.missed.push(appState.currentWord);
    practiceSession.streak = 0;
  }
  practiceSession.index++;
  renderPracticeRound();
  return true;
}
function endPracticeRound() {
  clearTimeout(appState.nextQuestionTimer);
  practiceSession = null;
  renderPracticeRound();
}
function finishPracticeRound() {
  appState.currentWord = { text: '' };
  window.speechSynthesis?.cancel();
  document.getElementById('word-display').textContent = 'Round complete!';
  document.getElementById('options-container').replaceChildren();
  document.getElementById('content-note').textContent = '';
  const { correct, queue, bestStreak, missed, retry, selection } = practiceSession;
  const key = `${APP_PREFIX}_round_best_${selection}:${queue.length}`;
  let best = 0;
  try {
    best = Math.min(queue.length, Math.max(0, Number(localStorage.getItem(key)) || 0));
    if (!retry) { best = Math.max(best, correct); localStorage.setItem(key, String(best)); }
  } catch { /* Results still work without device storage. */ }
  setPracticeStatus(`${correct} / ${queue.length} correct on the first try. Best streak: ${bestStreak}. ${retry ? 'Mistake review complete.' : `Personal best: ${best} / ${queue.length}.`}`);
  const retryButton = document.getElementById('round-retry');
  if (retryButton) retryButton.hidden = !missed.length;
  const endButton = document.getElementById('round-end');
  if (endButton) endButton.textContent = 'Free practice';
  renderPracticeRound();
}
function renderPracticeRound() {
  const meter = document.getElementById('round-meter');
  const label = document.getElementById('round-label');
  const end = document.getElementById('round-end');
  const retry = document.getElementById('round-retry');
  if (!meter || !label) return;
  const round = practiceSession;
  meter.hidden = !round;
  meter.max = round ? round.queue.length : 10;
  meter.value = round ? round.index : 0;
  label.textContent = round ? `${round.index} / ${round.queue.length} answered · ${round.correct} correct · streak ${round.streak}` : 'Ten different questions. One answer per question.';
  if (end) end.hidden = !round;
  if (retry && (!round || round.index < round.queue.length)) retry.hidden = true;
}
function initPracticeRounds() {
  const panel = document.createElement('section');
  panel.className = 'round-panel';
  panel.setAttribute('aria-label', 'Practice round');
  panel.innerHTML = '<div class="round-actions"><button type="button" id="round-start">Start 10-question round</button><button type="button" id="round-retry" hidden>Retry mistakes</button><button type="button" id="round-end" hidden>Free practice</button></div><p id="round-label" aria-live="polite"></p><progress id="round-meter" max="10" value="0" hidden aria-label="Round progress"></progress><p class="round-hint">Easy: familiar meanings. Medium: expressions in everyday situations. Hard: figurative meanings and conversational nuance.</p>';
  document.getElementById('options-container').before(panel);
  document.getElementById('round-start').onclick = () => startPracticeRound();
  document.getElementById('round-retry').onclick = () => startPracticeRound(true);
  document.getElementById('round-end').onclick = () => { endPracticeRound(); loadNextQuestion(); };
  renderPracticeRound();
}

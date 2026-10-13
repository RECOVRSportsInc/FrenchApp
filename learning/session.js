let courseSession = null;
let courseGeneration = 0;
function courseSessionCurrent() {
  return Boolean(courseSession && courseSession.owner === appState.syncCode && courseSession.learning === learningLanguage &&
    courseSession.answers === answerLanguage && appState.tabActive && !appState.switchingCode);
}
function prepareCourseSession(category, tierIndex, lessonIndex = null) {
  if (!Number.isInteger(tierIndex) || tierIndex < 0 || tierIndex > 2 || !Object.hasOwn(contentCategories, category) || category === 'all' ||
      (lessonIndex !== null && (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex > 2)) ||
      !appState.tabActive || appState.switchingCode || readRoadmapStore().blocked || !roadmapTierUnlocked(category, tierIndex)) return false;
  const test = lessonIndex === null;
  if (!test && !roadmapLessonUnlocked(category, tierIndex, lessonIndex)) return false;
  const tier = courseTiers[tierIndex].id, pool = getCoursePool(category, tier);
  const mode = test ? null : courseLessons[lessonIndex].mode;
  const words = shuffleOptions(pool.filter(row => row.mode === 'vocabulary'));
  const sentences = shuffleOptions(pool.filter(row => row.mode === 'sentences'));
  let queue;
  if (test) {
    const sentenceCount = Math.min(10, sentences.length);
    queue = shuffleOptions([...sentences.slice(0, sentenceCount), ...words.slice(0, 20 - sentenceCount)]);
    if (queue.length !== 20) return false;
  } else queue = mode ? shuffleOptions(pool.filter(row => row.mode === mode)).slice(0, 8)
    : shuffleOptions([...words.slice(0, 4), ...sentences.slice(0, 4)]);
  if (!queue.length) return false;
  window.speechSynthesis?.cancel(); endPracticeRound();
  courseSession = { category, tierIndex, lessonIndex, test, tier, pool, queue, tasks: queue.map(row => courseTask(row, tier, pool)), index: 0, correct: 0,
    owner: appState.syncCode, learning: learningLanguage, answers: answerLanguage, answered: false,
    responses: [], saved: false, studying: !test, generation: ++courseGeneration };
  showLearningView('lesson'); renderCourseSession(); return true;
}
function submitCourseResponse(response, generation, index) {
  const session = courseSession;
  if (!courseSessionCurrent() || session.studying || session.answered || session.generation !== generation || session.index !== index) return;
  const task = session.tasks[index];
  const correct = gradeCourseTask(task, response);
  session.answered = true;
  session.correct += Number(correct);
  session.responses.push({ task, response, correct });
  if (!session.test) {
    recordWordAnswer({ id: task.row.id, text: task.source, answer: task.meaning }, correct);
    if (correct) { appState.xp += 10; appState.pendingXP += 10; }
    saveLocally();
    if (correct) autoSyncToCloud();
  }
  renderCourseSession();
}
function advanceCourseSession() {
  if (!courseSessionCurrent() || !courseSession.answered) return;
  courseSession.index++;
  courseSession.answered = false;
  if (courseSession.index === courseSession.queue.length) saveRoadmapResult(courseSession);
  renderCourseSession();
}
function abandonCourseSession() { courseSession = null; window.speechSynthesis?.cancel(); }
function beginCourseQuestions() {
  if (!courseSessionCurrent() || !courseSession.studying) return;
  courseSession.studying = false; renderCourseSession();
}

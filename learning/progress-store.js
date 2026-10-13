const roadmapStoreCache = new Map();
function roadmapStoreKey(code = appState.syncCode) { return `${APP_PREFIX}_roadmap_v2_${code}`; }
function emptyRoadmapRecord() { return { version: COURSE_VERSION, pairs: {} }; }
function readRoadmapStore(code = appState.syncCode) {
  if (roadmapStoreCache.has(code)) return roadmapStoreCache.get(code);
  const store = { data: emptyRoadmapRecord(), error: '', raw: null, blocked: false };
  try {
    store.raw = localStorage.getItem(roadmapStoreKey(code));
    if (store.raw) {
      const data = JSON.parse(store.raw);
      if (data.version !== COURSE_VERSION || !data.pairs || typeof data.pairs !== 'object' || Array.isArray(data.pairs)) throw new Error();
      for (const pair of Object.values(data.pairs)) {
        if (!pair || typeof pair !== 'object' || Array.isArray(pair)) throw new Error();
        for (const topic of Object.values(pair)) {
          if (!Array.isArray(topic) || topic.length !== 3) throw new Error();
          for (const tier of topic) {
            if (!tier || !Number.isInteger(tier.best) || tier.best < 0 || tier.best > 20 ||
              typeof tier.passed !== 'boolean' || (tier.passed && tier.best < 15) || !tier.lessons ||
              courseLessons.some(lesson => typeof tier.lessons[lesson.id] !== 'boolean')) throw new Error();
          }
          if (topic.some((tier, index) => index > 0 && (tier.passed || Object.values(tier.lessons).some(Boolean)) && !topic[index - 1].passed)) throw new Error();
          if (topic.some(tier => !tier.passed && ((tier.lessons.sentences && !tier.lessons.words) || (tier.lessons.mixed && !tier.lessons.sentences)))) throw new Error();
          if ((topic[1].passed && !topic[0].passed) || (topic[2].passed && !topic[1].passed)) throw new Error();
        }
      }
      store.data = data;
    }
  } catch {
    store.blocked = Boolean(store.raw);
    store.error = 'Roadmap progress could not be read. Export a backup before changing browser storage.';
  }
  roadmapStoreCache.set(code, store); return store;
}
function roadmapTopic(category, learning = learningLanguage, answers = answerLanguage, code = appState.syncCode) {
  const pair = readRoadmapStore(code).data.pairs[`${learning}:${answers}`];
  return pair?.[category] || courseTiers.map(() => ({ best: 0, passed: false, lessons: { words: false, sentences: false, mixed: false } }));
}
function roadmapTierUnlocked(category, tierIndex) {
  return tierIndex === 0 || roadmapTopic(category)[tierIndex - 1].passed;
}
function roadmapLessonUnlocked(category, tierIndex, lessonIndex) {
  const tier = roadmapTopic(category)[tierIndex];
  return roadmapTierUnlocked(category, tierIndex) && (tier.passed || lessonIndex === 0 || tier.lessons[courseLessons[lessonIndex - 1].id]);
}
function saveRoadmapResult(session) {
  if (session.saved || session.index !== session.queue.length || session.owner !== appState.syncCode ||
      session.learning !== learningLanguage || session.answers !== answerLanguage) return false;
  const store = readRoadmapStore();
  if (store.blocked || !roadmapTierUnlocked(session.category, session.tierIndex)) return false;
  const pairKey = `${session.learning}:${session.answers}`;
  const pair = store.data.pairs[pairKey] || (store.data.pairs[pairKey] = {});
  const topic = pair[session.category] || (pair[session.category] = roadmapTopic(session.category));
  const tier = topic[session.tierIndex];
  const passed = session.correct * 4 >= session.queue.length * 3;
  if (session.test && session.queue.length === 20) { tier.best = Math.max(tier.best, session.correct); tier.passed ||= passed; }
  else if (!session.test && passed && roadmapLessonUnlocked(session.category, session.tierIndex, session.lessonIndex))
    tier.lessons[courseLessons[session.lessonIndex].id] = true;
  session.saved = true;
  try { localStorage.setItem(roadmapStoreKey(), JSON.stringify(store.data)); store.error = ''; }
  catch { store.error = 'New roadmap progress is only held in this open page. Export a backup before closing it.'; }
  return passed;
}
function getRoadmapBackup() {
  const store = readRoadmapStore();
  return { scope: 'this-device', ...store.data, storageError: store.error || null,
    unreadableOriginal: store.blocked ? store.raw : null };
}

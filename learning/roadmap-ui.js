function renderTopicRoadmap() {
  const container = document.getElementById('topic-roadmap'); if (!container) return;
  container.replaceChildren();
  const category = learningMapSelection, progress = roadmapTopic(category);
  const heading = document.createElement('h2'); heading.textContent = `${category === 'slang' && learningLanguage === 'ar' ? 'Everyday & figurative expressions (MSA)' : contentCategories[category]} · Your path`; container.appendChild(heading);
  const description = document.createElement('p'); description.textContent = `${languageCatalog[learningLanguage].name} → ${languageCatalog[answerLanguage].name}. Each topic advances independently. Test out with 15/20 to skip unfinished lessons.`; container.appendChild(description);
  for (let tierIndex = 0; tierIndex < 3; tierIndex++) {
    const tier = courseTiers[tierIndex], record = progress[tierIndex], unlocked = roadmapTierUnlocked(category, tierIndex);
    const section = document.createElement('section'); section.className = `road-tier ${unlocked ? '' : 'locked'}`;
    const title = document.createElement('h3'); title.textContent = `${tierIndex + 1}. ${tier.title} · ${tier.subtitle}`;
    const text = document.createElement('p'); text.textContent = tier.description;
    const list = document.createElement('ol'); list.className = 'road-stops';
    for (let lessonIndex = 0; lessonIndex < 3; lessonIndex++) {
      const lesson = courseLessons[lessonIndex], available = roadmapLessonUnlocked(category, tierIndex, lessonIndex);
      const completed = record.lessons[lesson.id], skipped = record.passed && !completed;
      const row = document.createElement('li'); row.className = `road-stop ${completed ? 'done' : skipped ? 'skipped' : available ? 'available' : 'locked'}`;
      const button = document.createElement('button'); button.type = 'button'; button.disabled = !available || readRoadmapStore().blocked;
      const number = document.createElement('span'); number.className = 'road-stop-number'; number.textContent = completed ? '✓' : skipped ? '↗' : String(tierIndex * 3 + lessonIndex + 1);
      const name = document.createElement('strong'); name.textContent = lesson.title;
      const state = document.createElement('span'); state.textContent = completed ? 'Completed · Review' : skipped ? 'Skipped by test · Review' : available ? 'Study and practise' : 'Complete the previous stop';
      button.append(number, name, state); button.onclick = () => prepareCourseSession(category, tierIndex, lessonIndex); row.appendChild(button); list.appendChild(row);
    }
    const test = document.createElement('button'); test.type = 'button'; test.className = 'road-test';
    test.textContent = record.passed ? `Tier cleared · Best ${record.best}/20 · Retake` : `Test out of ${tier.title} · Pass with 15/20`;
    test.disabled = !unlocked || readRoadmapStore().blocked;
    test.onclick = () => prepareCourseSession(category, tierIndex);
    section.append(title, text, list, test);
    if (!unlocked) { const lock = document.createElement('p'); lock.textContent = `Clear ${courseTiers[tierIndex - 1].title} with 75% to unlock this tier.`; section.appendChild(lock); }
    container.appendChild(section);
  }
  const error = readRoadmapStore().error;
  if (error) { const notice = document.createElement('p'); notice.setAttribute('role', 'status'); notice.textContent = error; container.appendChild(notice); }
}
function refreshRoadmapContext() {
  if (courseSession && !courseSessionCurrent()) renderCourseSession();
}

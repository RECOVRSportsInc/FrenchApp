function courseElement(id) { return document.getElementById(`course-${id}`); }
function initCourseUI() {
  const section = document.createElement('section'); section.id = 'course-page'; section.className = 'course-page';
  section.setAttribute('aria-labelledby', 'course-heading');
  section.innerHTML = '<div class="course-heading-row"><button id="course-back" type="button">Back to roadmap</button><span id="course-badge"></span></div><h1 id="course-heading" tabindex="-1"></h1><p id="course-description"></p><progress id="course-progress" max="20" value="0" aria-label="Questions answered"></progress><div id="course-study"></div><div id="course-question"></div><div id="course-response"></div><p id="course-feedback" role="status" aria-live="polite"></p><button id="course-next" type="button" hidden>Next question</button><div id="course-results" hidden></div>';
  document.querySelector('.layout').before(section);
  for (const id of ['practice-level', 'practice-category']) document.getElementById(id)?.parentElement?.classList.add('roadmap-filter');
  courseElement('back').onclick = () => { abandonCourseSession(); showLearningView('learn'); renderLearningMap(); };
  courseElement('next').onclick = advanceCourseSession;
}
function renderCourseSession() {
  if (!courseElement('page')) return;
  if (!courseSessionCurrent()) {
    courseElement('heading').textContent = 'Session ended'; courseElement('description').textContent = 'Your language or learner changed. Return to the roadmap to start again.';
    for (const id of ['study', 'question', 'response', 'results']) courseElement(id).replaceChildren();
    courseElement('next').hidden = true; return;
  }
  const session = courseSession;
  const finished = session.index === session.queue.length;
  courseElement('heading').textContent = `${contentCategories[session.category]} · ${courseTiers[session.tierIndex].title}`;
  courseElement('badge').textContent = session.test ? '20-question tier test' : courseLessons[session.lessonIndex].title;
  courseElement('progress').max = session.queue.length; courseElement('progress').value = session.index;
  courseElement('description').textContent = session.test
    ? 'Score at least 15/20 to clear this tier. One answer per question. No hints, audio or answer feedback until the end.'
    : 'Study the examples, then practise. At least 75% completes the lesson. Correct first answers earn +10 XP; mistakes do not deduct XP.';
  courseElement('results').hidden = !finished; courseElement('next').hidden = !session.answered || finished;
  for (const id of ['study', 'question', 'response']) courseElement(id).replaceChildren();
  courseElement('feedback').textContent = '';
  if (finished) { renderCourseResults(); return; }
  if (session.studying) { renderCourseStudy(); return; }
  const task = session.tasks[session.index];
  const prompt = document.createElement('h2'); prompt.textContent = task.prompt;
  prompt.lang = languageCatalog[task.promptLanguage].speech; prompt.dir = languageCatalog[task.promptLanguage].direction;
  const instruction = document.createElement('p'); instruction.textContent = task.kind === 'choice'
    ? `Choose the ${languageCatalog[task.responseLanguage].name} ${session.tier === 'easy' ? 'meaning' : 'reply'}`
    : task.kind === 'recall' ? 'Recall the taught word or expression. No answer choices.' : 'Construct the taught sentence using the words below.';
  courseElement('question').append(instruction, prompt);
  if (session.answered) {
    courseElement('feedback').textContent = session.test ? 'Answer recorded.' : `${session.responses.at(-1).correct ? 'Correct!' : 'Expected taught form:'} ${task.answer}`;
  } else {
    const generation = session.generation, index = session.index;
    renderCourseTask(courseElement('response'), task, value => submitCourseResponse(value, generation, index));
  }
  courseElement('next').textContent = session.index === session.queue.length - 1 ? 'See results' : 'Next question';
}
function renderCourseStudy() {
  const session = courseSession, mode = courseLessons[session.lessonIndex].mode;
  const rows = mode ? session.pool.filter(row => row.mode === mode) : session.queue;
  const intro = document.createElement('p'); intro.textContent = 'Read these taught forms before starting. The hard sentence task asks you to reconstruct these forms; it is not a free translation test.';
  const grid = document.createElement('div'); grid.className = 'course-study-grid';
  for (const row of rows) {
    const card = document.createElement('div'); card.className = 'course-study-card';
    const source = document.createElement('strong'); source.textContent = courseTranslation(row, session.learning);
    source.lang = languageCatalog[session.learning].speech; source.dir = languageCatalog[session.learning].direction;
    const meaning = document.createElement('p'); meaning.textContent = courseTranslation(row, session.answers);
    meaning.lang = languageCatalog[session.answers].speech; meaning.dir = languageCatalog[session.answers].direction;
    card.append(source, meaning); grid.appendChild(card);
  }
  const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Start lesson'; start.onclick = beginCourseQuestions;
  courseElement('study').append(intro, grid, start);
}
function renderCourseResults() {
  const session = courseSession, container = courseElement('results'); container.replaceChildren();
  const passed = session.correct * 4 >= session.queue.length * 3;
  const title = document.createElement('h2'); title.textContent = `${session.correct} / ${session.queue.length} · ${passed ? 'Passed' : 'Keep practising'}`;
  const message = document.createElement('p');
  message.textContent = session.test ? passed ? session.tierIndex === 2 ? 'Topic complete. You cleared all three tiers.' : 'Tier cleared. The next tier is unlocked. Unfinished lessons in this tier can still be reviewed.'
    : 'Score 15/20 to clear this tier. Your previous completions remain available.'
    : passed ? 'Lesson complete. Return to the roadmap for the next stop.' : `You need ${Math.ceil(session.queue.length * .75)} correct answers to complete this lesson.`;
  const error = readRoadmapStore().error;
  if (error) message.textContent += ` ${error}`;
  const review = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'Review answers'; review.appendChild(summary);
  for (const response of session.responses) {
    const row = document.createElement('p'); row.textContent = `${response.correct ? '✓' : '○'} ${response.task.prompt} → ${response.task.answer}`; review.appendChild(row);
  }
  const back = document.createElement('button'); back.type = 'button'; back.textContent = 'Continue on the roadmap';
  back.onclick = () => { abandonCourseSession(); showLearningView('learn'); renderLearningMap(); };
  container.append(title, message, review, back); renderLearningMap();
}

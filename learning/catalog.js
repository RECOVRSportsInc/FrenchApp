// One curriculum serves the roadmap and free practice in every supported language.
const curriculumAdditions = [];
const COURSE_VERSION = 2;
const courseTiers = [
  { id: 'easy', title: 'Easy', subtitle: 'Build a foundation', description: 'Core words and short exchanges. Recognise meanings with three choices.' },
  { id: 'medium', title: 'Medium', subtitle: 'Use the language', description: 'Specific vocabulary, time, reasons and details. Choose what to say in the language you are learning.' },
  { id: 'hard', title: 'Hard', subtitle: 'Respond independently', description: 'Precise vocabulary and complex sentences. Recall words without choices and reconstruct sentences.' }
];
const courseLessons = [{ id: 'words', title: 'Core vocabulary', mode: 'vocabulary' },
  { id: 'sentences', title: 'Sentences in context', mode: 'sentences' }, { id: 'mixed', title: 'Put it together', mode: null }];
let curriculumInstalled = false;
let courseRows = [];
function cleanCourseText(text) { return text.replace(/\s*\([^)]*\)/gu, '').trim(); }
function courseTranslation(row, language) {
  return cleanCourseText(row.sourceLanguage === language ? row.sourceText : translationFor(row, language));
}
function installCurriculum() {
  if (curriculumInstalled) return;
  const selected = [];
  const introducedWords = new Set();
  for (const category of Object.keys(contentCategories).filter(id => id !== 'all')) {
    for (const tier of courseTiers) {
      const additions = curriculumAdditions.filter(row => row.categories[0] === category && row.level === tier.id);
      selected.push(...additions);
      if (['phrases', 'slang'].includes(category)) continue;
      const originals = addedContent.filter(row => categoriesFor(row).includes(category) && levelFor(row, row.mode) === tier.id &&
        !row.curatedExpression && (!row.bankTopic || row.bankPattern === 'vocabulary:1'));
      const words = originals.filter(row => row.mode === 'vocabulary').slice(0, 24);
      const sentences = originals.filter(row => row.mode === 'sentences' && !row.bankTopic).slice(0, 3);
      for (const row of words) {
        const concept = `${category}:${courseWordAnswer(row.en, 'en')}`;
        if (!introducedWords.has(concept)) { introducedWords.add(concept); selected.push(row); }
      }
      selected.push(...sentences);
    }
  }
  courseRows = [...new Map(selected.map(row => [row.id, row])).values()];
  vocabulary.push(...curriculumAdditions.filter(row => row.mode === 'vocabulary'));
  sentences.push(...curriculumAdditions.filter(row => row.mode === 'sentences'));
  addedContent.push(...curriculumAdditions);
  curriculumInstalled = true;
}
function getCoursePool(category, tier, mode = null, learning = learningLanguage, answers = answerLanguage) {
  const seen = new Set();
  return courseRows.filter(row => {
    if (!categoriesFor(row).includes(category) || row.level !== tier || (mode && row.mode !== mode)) return false;
    if (row.sourceLanguage && row.sourceLanguage !== learning) return false;
    if (!translationFor(row, learning) || !translationFor(row, answers)) return false;
    const key = `${row.mode}:${row.mode === 'vocabulary' ? courseWordAnswer(courseTranslation(row, learning), learning) : normalizeMeaning(courseTranslation(row, learning))}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

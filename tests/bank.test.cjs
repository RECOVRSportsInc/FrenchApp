const fs = require('node:fs'), path = require('node:path');
const vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ Math, console });
const run = source => vm.runInContext(source, context);
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
run('const expandedContent = [];');
const html = read('index.html');
for (const match of html.matchAll(/<script src="([^?"]+)/g)) {
  const name = match[1];
  if (['words.js', 'languages.js', 'categories.js', 'content-library.js', 'vocabulary.js', 'question-bank.js', 'data/levels.js'].includes(name) || name.startsWith('data/')) run(read(name));
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
for (const file of [...walk(path.join(root, 'data/banks')), ...walk(path.join(root, 'data/expressions'))]) {
  const source = fs.readFileSync(file, 'utf8');
  assert(source.split('\n').length <= 150, file);
  run(source);
}
run(`addedContent.push(...expandedContent);
vocabulary.push(...expandedContent.filter(row => row.mode === 'vocabulary'));
sentences.push(...expandedContent.filter(row => row.mode === 'sentences'));
let learningLanguage = 'fr', answerLanguage = 'en';`);
const all = run('[...vocabulary, ...sentences]');
assert.equal(new Set(all.map(row => row.id)).size, all.length, 'Duplicate IDs');
assert.equal(run('expandedContent.length'), 4840);
for (const row of all.filter(row => !row.curatedExpression)) for (const code of ['en', 'fr', 'pl', 'es', 'it', 'ar']) {
  assert(row[code] && !/[~{}]/u.test(row[code]), `${row.id}/${code}`);
}
let checks = 0;
const counts = [];
for (const mode of ['vocabulary', 'sentences']) {
  for (const level of ['easy', 'medium', 'hard']) {
    for (const category of ['work', 'healthcare', 'sports', 'travel', 'home', 'gym', 'phrases', 'slang']) {
      let minimum = Infinity;
      for (const learning of run('Object.keys(languageCatalog)')) {
        for (const answer of run('Object.keys(languageCatalog)')) {
          if (run(`sameLanguageFamily('${learning}', '${answer}')`)) continue;
          run(`practiceMode='${mode}';practiceLevel='${level}';practiceCategory='${category}';learningLanguage='${learning}';answerLanguage='${answer}';`);
          const rows = run('getActiveWords()');
          const curated = ['fr', 'ar'].includes(learning) && ['en', 'fr', 'ar'].includes(answer) && ['phrases', 'slang'].includes(category);
          assert(rows.length >= (curated ? 10 : 100), `${mode}/${level}/${category}/${learning}/${answer}: ${rows.length}`);
          minimum = Math.min(minimum, rows.length);
          for (const row of rows) {
            assert.equal(row.options.length, 4);
            assert.equal(new Set(row.options.map(value => value.normalize('NFC').toLowerCase())).size, 4);
            assert(row.options.includes(row.answer));
          }
          checks++;
        }
      }
      counts.push({ mode, category, level, minimumQuestions: minimum });
    }
  }
}
console.log(JSON.stringify({ checks, originalBankMinimum: 100, curatedExpressionMinimum: 10, counts }, null, 2));

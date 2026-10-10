const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const nodes = new Map();
const element = () => ({ textContent: '', hidden: false, replaceChildren() {}, classList: { add() {} } });
for (const id of ['round-meter','round-label','round-end','round-retry','word-display','options-container','content-note','practice-status']) nodes.set(id, element());
const stored = new Map(), timers = [];
const context = vm.createContext({
  appState: {tabActive:true,switchingCode:false,currentWord:{},xp:0,pendingXP:0},
  learningLanguage:'fr',answerLanguage:'en',practiceMode:'vocabulary',practiceCategory:'slang',practiceLevel:'easy',
  APP_PREFIX:'test',localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},
  getActiveWords:()=>Array.from({length:15},(_,i)=>({id:`q${i}`,text:`t${i}`,answer:`a${i}`})),
  shuffleOptions:values=>[...values],loadNextQuestion(){},showLearningView(){},
  setPracticeStatus:text=>{context.status=text;},
  clearTimeout(){},setTimeout:fn=>{timers.push(fn);return timers.length;},
  window:{speechSynthesis:{cancel(){}}},
  document:{getElementById:id=>nodes.get(id),querySelectorAll:()=>[element(),element()]},
  recordWordAnswer(){},saveLocally(){},autoSyncToCloud(){}
});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(require('node:path').join(__dirname,'../session.js'),'utf8'));
run(fs.readFileSync(require('node:path').join(__dirname,'../quiz.js'),'utf8'));
run('loadNextQuestion=()=>{};startPracticeRound();');
assert.equal(run('practiceSession.queue.length'),10);
assert.equal(run('new Set(practiceSession.queue.map(q=>q.id)).size'),10);
run('appState.currentWord=nextSessionQuestion([]);checkAnswer({disabled:false,classList:{add(){}}}, "wrong");');
assert.equal(run('practiceSession.index'),1);
assert.equal(timers.length,1,'one advance timer per answer');
run('checkAnswer({disabled:false,classList:{add(){}}}, appState.currentWord.answer);');
assert.equal(run('practiceSession.index'),1,'ignore repeated answer clicks');
run('for(let i=1;i<10;i++){appState.currentWord=nextSessionQuestion([]);answerPracticeRound(true);}nextSessionQuestion([]);');
assert(nodes.get('practice-status').textContent.includes('9 / 10'));
assert.equal(nodes.get('round-retry').hidden,false);
run('startPracticeRound(true);');
assert.equal(run('practiceSession.queue.length'),1);
assert.equal(run('practiceSession.queue[0].id'),'q0');
run('appState.currentWord=nextSessionQuestion([]);answerPracticeRound(true);nextSessionQuestion([]);');
assert.equal(nodes.get('round-retry').hidden,true);
assert.equal(stored.size,1,'retry cannot overwrite full-round best');
run('startPracticeRound();practiceLevel="hard";nextSessionQuestion([]);');
assert.equal(run('practiceSession'),null,'changing filters cancels the old round');
run('startPracticeRound();appState.currentWord=nextSessionQuestion([]);checkAnswer({disabled:false,classList:{add(){}}}, appState.currentWord.answer);');
assert.equal(timers.length,2,'correct answer also schedules only one timer');
console.log('PASS: unique rounds, first-answer scoring, double-click protection, one timer, results, retry and filter changes.');

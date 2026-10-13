const assert=require('node:assert/strict'),setup=require('./course-fixture.cjs');
const {run}=setup();let checks=0,minWords=Infinity,minSentences=Infinity;
for(const learning of run('Object.keys(languageCatalog)'))for(const answers of run('Object.keys(languageCatalog)')){
 if(run(`sameLanguageFamily('${learning}','${answers}')`))continue;
 run(`learningLanguage='${learning}';answerLanguage='${answers}';`);
 for(const category of run('Object.keys(contentCategories).filter(key=>key!=="all")'))for(const tier of ['easy','medium','hard']){
  const pool=run(`getCoursePool('${category}','${tier}')`),words=pool.filter(row=>row.mode==='vocabulary'),sentences=pool.filter(row=>row.mode==='sentences');
  minWords=Math.min(minWords,words.length);minSentences=Math.min(minSentences,sentences.length);
  assert(pool.length>=20,`${learning}/${answers}/${category}/${tier}: ${pool.length}`);
  assert(sentences.length>=5,`${category}/${tier}: sentence coverage`);
  assert.equal(new Set(pool.map(row=>row.id)).size,pool.length);
  assert(!sentences.some(row=>row.bankTopic),'exclude template sentence banks');
  assert(!words.some(row=>row.bankPattern&&row.bankPattern!=='vocabulary:1'));
  const tasks=run(`getCoursePool('${category}','${tier}').map(row=>courseTask(row,'${tier}',getCoursePool('${category}','${tier}')))`);
  for(const task of tasks){
   assert(run(`gradeCourseTask(${JSON.stringify(task)},${JSON.stringify(task.answer)})`));
   if(tier==='easy')assert.equal(task.options.length,3);
   if(tier==='medium')assert.equal(task.options.length,4);
   if(tier==='hard')assert.equal(task.kind,task.row.mode==='sentences'?'order':'recall');
  }
  checks++;
 }
}
run("learningLanguage='fr';answerLanguage='en';");
assert.equal(run('courseWordAnswer("lait","fr")'),'lait');
assert.equal(run('courseWordAnswer("l’endurance","fr")'),'endurance');
assert.notEqual(run('normalizeCourseAnswer("Je ne suis pas prêt")'),run('normalizeCourseAnswer("Je suis prêt")'));
for(const language of ['en','fr','frCA','pl','es','it','ar']){
 const averages=[];
 for(const level of ['easy','medium','hard']){
  const rows=run(`courseRows.filter(row=>!['phrases','slang'].includes(row.categories[0])&&row.mode==='sentences'&&row.level==='${level}')`);
  const counts=rows.map(row=>run(`courseTranslation(${JSON.stringify(row)},'${language}')`).split(/\s+/u).length);
  averages.push(counts.reduce((a,b)=>a+b,0)/counts.length);
 }
 assert(averages[2]>averages[1]&&averages[1]>averages[0],`${language}: sentence complexity does not rise`);
}
console.log(`PASS: ${checks} topic/tier/language-pair combinations; minimum ${minWords} words and ${minSentences} authored sentences; distinct task types and no template sentences.`);

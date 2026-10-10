const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});
vm.runInContext('const expandedContent=[];',context);
for(const file of fs.readdirSync(path.join(__dirname,'../data/expressions')))
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/expressions',file),'utf8'),context);
const rows=vm.runInContext('expandedContent',context);
assert.equal(rows.length,240);
assert.equal(new Set(rows.map(r=>r.id)).size,240);
for(const lang of ['fr','ar']) for(const category of ['phrases','slang']) for(const level of ['easy','medium','hard']) {
  const bucket=rows.filter(r=>r.sourceLanguage===lang&&r.categories[0]===category&&r.level===level);
  assert.equal(bucket.length,20);
  assert.equal(new Set(bucket.map(r=>r.sourceText)).size,20,'expressions and context examples must differ');
  for(const row of bucket){
    for(const code of ['en','fr','ar']) assert.equal(typeof row[code],'string');
    assert(row.note);
    if(lang==='ar') assert(row.note.startsWith('Modern Standard Arabic; not dialect slang.'));
  }
}
assert(rows.some(r=>r.sourceText==='Ça marche !'&&r.en==='Sounds good!'));
assert(rows.some(r=>r.sourceText==='J\'en ai marre.'&&r.en==="I'm fed up."));
assert(rows.some(r=>r.sourceText==='ضرب عصفورين بحجر واحد.'&&r.en==='Kill two birds with one stone.'));
console.log('PASS: distinct expressions, separate context sentences, complete meanings and MSA labels. Translation quality still requires human review.');

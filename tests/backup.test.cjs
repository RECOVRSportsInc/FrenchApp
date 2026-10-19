const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let blob,clicked=false;
const context=vm.createContext({appState:{syncCode:'1234',xp:90,pendingXP:10,writeIntent:null},
  learningJournalKey:()=> 'journal',localStorage:{getItem:()=>'{preserve-recovery}'},
  getWordProgressBackup:()=>({unreadableOriginal:'{damaged-history}'}),
  getRoadmapBackup:()=>({version:2,pairs:{}}),getDailyBackup:()=>({unreadableOriginal:'{damaged-daily}'}),
  Blob,URL:{createObjectURL:value=>{blob=value;return 'blob:test';},revokeObjectURL(){}},
  document:{createElement:()=>({click(){clicked=true;}})},setTimeout(){}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../daily/backup.js'),'utf8'),context);
vm.runInContext('downloadLearningBackup()',context);
(async()=>{
 const data=JSON.parse(await blob.text());
 assert(clicked);assert.equal(data.version,3);assert.equal(data.xp,90);assert.equal(data.pendingXP,10);
 assert.equal(data.wordProgress.unreadableOriginal,'{damaged-history}');
 assert.equal(data.dailyActivity.unreadableOriginal,'{damaged-daily}');
 assert.equal(data.learningSyncRecovery,'{preserve-recovery}');assert.equal(data.code,'1234');
 assert.equal(data.learningKey,undefined);
 console.log('PASS: backup retains XP, roadmap, daily activity, damaged originals and interrupted-import journal without exporting private learning keys.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const S=require('../shared/progress-schema.js'),M=require('../shared/progress-merge.js');
const root=path.resolve(__dirname,'..');
function device(fetcher) {
  const disk=new Map(), state={syncCode:'1234',tabActive:true,switchingCode:false};
  let failWrite=null;
  const context=vm.createContext({appState:state,APP_PREFIX:'test',COURSE_VERSION:2,courseTiers:[0,1,2],
    courseLessons:[{id:'words'},{id:'sentences'},{id:'mixed'}],learningLanguage:'fr',answerLanguage:'en',
    ProgressSchema:S,ProgressMerge:M,structuredClone,crypto:webcrypto,navigator:{onLine:true},
    localStorage:{getItem:key=>disk.get(key)||null,setItem:(key,value)=>{if(key===failWrite)throw new Error('Disk full');disk.set(key,value);},removeItem:key=>disk.delete(key)},
    document:{getElementById:()=>null},window:{learningSyncConfig:{endpoint:'https://example.test'}},
    URL,AbortController,fetch:fetcher,setTimeout:()=>1,clearTimeout(){},renderWordProgress(){},renderToday(){}});
  for(const file of ['word-progress.js','learning/progress-store.js','daily/activity-store.js',
    'progress-sync/local-state.js','progress-sync/client.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  const run=source=>vm.runInContext(source,context);
  run(`localStorage.setItem(learningKeyStorage(),'${'a'.repeat(64)}');recordDailyVisit()`);
  return {run,disk,state,context,fail:key=>failWrite=key};
}
(async()=>{
  let remote=null,revision=0,conflict=false,dropReply=false,beforePut=null,offline=false;
  async function fetcher(_url,options){
    if(offline)throw new Error('Offline');
    if(options.method==='GET')return {ok:true,json:async()=>({revision,data:structuredClone(remote)})};
    const body=JSON.parse(options.body);
    if(beforePut){const fn=beforePut;beforePut=null;fn();}
    if(conflict){conflict=false;revision++;return {ok:false,status:409,json:async()=>({error:'Conflict'})};}
    if(body.revision!==revision)return {ok:false,status:409,json:async()=>({error:'Conflict'})};
    remote=remote?M.merge(remote,body.data):body.data;revision++;
    if(dropReply){dropReply=false;throw new Error('Response lost after save');}
    return {ok:true,json:async()=>({revision,data:structuredClone(remote)})};
  }
  const a=device(fetcher),b=device(fetcher);
  for(const client of [a,b])client.run(`readWordHistory().data.pairs['fr:en']={'word-1':{id:'word-1',text:'bonjour',answer:'hello',correct:3,mistakes:1,lastPracticed:'2026-10-16T10:00:00Z'}}`);
  a.run("recordWordAnswer({id:'word-1',text:'bonjour',answer:'hello'},true)");
  b.run("recordWordAnswer({id:'word-1',text:'bonjour',answer:'hello'},false)");
  await Promise.all([a.run('syncLearningProgress()'),b.run('syncLearningProgress()')]);
  await a.run('syncLearningProgress()');await b.run('syncLearningProgress()');
  for(const client of [a,b]){
    assert.equal(client.run("readWordHistory().data.pairs['fr:en']['word-1'].correct"),4);
    assert.equal(client.run("readWordHistory().data.pairs['fr:en']['word-1'].mistakes"),2);
  }
  dropReply=true;
  a.run("recordWordAnswer({id:'word-1',text:'bonjour',answer:'hello'},true)");
  await a.run('syncLearningProgress()');await a.run('syncLearningProgress()');
  assert.equal(remote.history.pairs['fr:en']['word-1'].correct,5,'Lost response cannot double count');
  beforePut=()=>a.run("recordWordAnswer({id:'word-1',text:'bonjour',answer:'hello'},true)");
  a.run("recordLearningCompletion('"+'c'.repeat(32)+"','round',10,8,'1234')");
  await a.run('syncLearningProgress()');
  assert.equal(a.run("readWordHistory().data.pairs['fr:en']['word-1'].correct"),6,'Answers during fetch survive import');
  await a.run('syncLearningProgress()');assert.equal(remote.history.pairs['fr:en']['word-1'].correct,6);
  conflict=true;
  a.run("recordWordAnswer({id:'word-1',text:'bonjour',answer:'hello'},false)");
  await a.run('syncLearningProgress()');assert.equal(remote.history.pairs['fr:en']['word-1'].mistakes,3);
  // Scope switch while a GET is in flight must not install another learner's data.
  let resolve;const gate=new Promise(yes=>resolve=yes);
  const c=device(async()=>{await gate;return {ok:true,json:async()=>({revision,data:remote})};});
  const pending=c.run('syncLearningProgress()');c.state.syncCode='5678';resolve();await pending;
  assert.equal(c.disk.has('test_word_history_5678'),false);
  offline=true;await a.run('syncLearningProgress()');
  assert.match(a.run('learningSyncState.status'),/paused/);offline=false;
  const current=a.run('learningSnapshot()');
  a.fail('test_word_history_1234');
  assert.throws(()=>a.run('installLearningSnapshot(learningSnapshot(), appState.syncCode)'),/Disk full/);
  assert(a.disk.has('test_learning_import_1234'));
  a.fail(null);a.run('restoreLearningJournal()');
  assert.equal(a.disk.has('test_learning_import_1234'),false);
  assert.deepEqual(JSON.parse(JSON.stringify(a.run('learningSnapshot()'))),JSON.parse(JSON.stringify(current)));
  a.disk.set('test_learning_import_1234','{damaged');
  assert.throws(()=>a.run('restoreLearningJournal()'),/damaged/);
  assert.equal(a.disk.get('test_learning_import_1234'),'{damaged');
  console.log('PASS: two-device offline merging, conflicts, lost responses, in-flight answers, learner changes, offline status and interrupted local import recovery.');
})().catch(error=>{console.error(error);process.exitCode=1;});

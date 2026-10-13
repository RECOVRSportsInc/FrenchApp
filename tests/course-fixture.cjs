const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
module.exports=function setup(extra={}){
  const stored=new Map(),root=path.resolve(__dirname,'..');
  const context=vm.createContext({console,Math,localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
    appState:{syncCode:'1234',tabActive:true,switchingCode:false,xp:0,pendingXP:0},APP_PREFIX:'test',
    learningLanguage:'fr',answerLanguage:'en',window:{speechSynthesis:{cancel(){}}},endPracticeRound(){},
    showLearningView(){},renderCourseSession(){},recordWordAnswer(){},saveLocally(){},autoSyncToCloud(){},...extra});
  const run=source=>vm.runInContext(source,context),read=name=>fs.readFileSync(path.join(root,name),'utf8');
  run('const expandedContent=[];');
  for(const match of read('index.html').matchAll(/<script src="([^?"]+)/g)){
    const name=match[1];
    if(['words.js','languages.js','categories.js','content-library.js','vocabulary.js','question-bank.js','learning/catalog.js','learning/tasks.js','learning/progress-store.js','learning/session.js'].includes(name)||name.startsWith('data/'))run(read(name));
  }
  const bankFiles=run(read('bank-loader.js').match(/const expandedBankFiles = (\[[\s\S]*?\]);/)[1]);
  for(const file of bankFiles)run(read(file));
  run(`addedContent.push(...expandedContent);vocabulary.push(...expandedContent.filter(row=>row.mode==='vocabulary'));sentences.push(...expandedContent.filter(row=>row.mode==='sentences'));installCurriculum();`);
  return {context,run,stored,read};
};

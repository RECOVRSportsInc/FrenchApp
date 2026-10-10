const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let spoken=null;
const voices=[{name:'English',lang:'en-US',voiceURI:'en'},{name:'France',lang:'fr-FR',voiceURI:'fr'},{name:'Canada',lang:'fr-CA',voiceURI:'ca'},{name:'Arabic',lang:'ar-SA',voiceURI:'ar'}];
const context=vm.createContext({
  localStorage:{getItem:()=>null,setItem(){}},learningLanguage:'fr',questionVersion:1,
  appState:{currentWord:{text:'Ça marche !'}},languageCatalog:{fr:{speech:'fr-FR'},ar:{speech:'ar-SA'}},
  document:{getElementById:()=>null},setPracticeStatus:text=>{context.status=text;},
  SpeechSynthesisUtterance:function(text){this.text=text;},
  window:{speechSynthesis:{getVoices:()=>voices,cancel(){},speak:u=>{spoken=u;}}}
});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(require('node:path').join(__dirname,'../speech.js'),'utf8'));
run('speakWord(true)');assert.equal(spoken.voice.voiceURI,'fr');assert.equal(spoken.rate,.75);
run('voicePreferences.voices.fr="ca";speakWord()');assert.equal(spoken.voice.voiceURI,'ca');
run('learningLanguage="ar";speakWord()');assert.equal(spoken.voice.voiceURI,'ar');
voices.splice(3,1);spoken=null;run('speakWord()');assert.equal(spoken,null);assert(context.status.includes('No matching voice'));
assert.equal(run('speechAutoPlay()'),false);
console.log('PASS: locale preference, chosen voice, slow playback and no wrong-language fallback.');

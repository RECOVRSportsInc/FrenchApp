const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const nodes=new Map();
class Element {
  constructor(){this.children=[];this.dataset={};this.classList={add(){}};this.hidden=false;this.value='';this.parentElement=null;}
  set id(value){this._id=value;nodes.set(value,this);}get id(){return this._id;}
  set innerHTML(html){for(const match of html.matchAll(/id="([^"]+)"/g)){const child=new Element();child.id=match[1];this.children.push(child);}}
  setAttribute(){}append(...children){this.children.push(...children);}appendChild(child){this.children.push(child);}
  replaceChildren(){this.children=[];}before(){}focus(){}
}
const layout=new Element(),avatar=new Element(),body=new Element();body.dataset.learningView='conversations';
let spoken=null,roundEnds=0;
const context=vm.createContext({
  document:{body,getElementById:id=>nodes.get(id),createElement:()=>new Element(),querySelector:selector=>selector==='.layout'?layout:avatar},
  window:{speechSynthesis:{cancel(){},speak:u=>{spoken=u;}}},SpeechSynthesisUtterance:function(text){this.text=text;},
  appState:{syncCode:'1234',tabActive:true,switchingCode:false},learningLanguage:'fr',
  languageCatalog:{fr:{speech:'fr-FR',direction:'ltr'},ar:{speech:'ar-SA',direction:'rtl'}},
  shuffleOptions:values=>[...values],speechAutoPlay:()=>false,voicePreferences:{voices:{}},
  matchingVoices:()=>[{voiceURI:'voice',lang:context.learningLanguage==='ar'?'ar-SA':'fr-FR'}],
  endPracticeRound(){roundEnds++;}
});
const run=source=>vm.runInContext(source,context);
for(const name of ['data/conversations/groceries.js','conversation-engine.js','conversation-ui.js','conversation-results.js'])
  run(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
run('initConversations()');nodes.get('conversation-level').value='easy';
nodes.get('conversation-start').onclick();assert.equal(roundEnds,1);
assert.equal(nodes.get('conversation-form').hidden,true);
const oldButton=nodes.get('conversation-replies').children[0];oldButton.onclick();
assert.equal(run('groceryConversation.node'),'quantity');oldButton.onclick();assert.equal(run('groceryConversation.turns'),1);
for(const id of ['one','price','cash','own','bye']){run(`advanceGroceryConversation('${id}');renderGroceryTurn()`);}
assert.equal(nodes.get('conversation-results').hidden,false);
assert.equal(nodes.get('conversation-progress').value,5);
assert.equal(nodes.get('conversation-form').hidden,true);
run('learningLanguage="ar";renderConversationLanding()');assert.equal(run('groceryConversation'),null);
assert.equal(nodes.get('conversation-session').hidden,true);
nodes.get('conversation-level').value='medium';nodes.get('conversation-start').onclick();
assert.equal(nodes.get('conversation-input').dir,'rtl');assert.equal(nodes.get('conversation-form').hidden,false);
nodes.get('conversation-input').value='لا أريد تفاحا';run('sendGroceryText()');assert.equal(run('groceryConversation.turns'),0);
nodes.get('conversation-hint').onclick();assert.equal(nodes.get('conversation-replies').hidden,false);
nodes.get('conversation-input').value='أريد تفاحا';run('sendGroceryText()');assert.equal(run('groceryConversation.node'),'quantity');
assert.equal(run('groceryConversation.independent'),0);
run('speakGroceryCharacter(true)');assert.equal(spoken.lang,'ar-SA');assert.equal(spoken.rate,.75);
context.matchingVoices=()=>[];spoken=null;run('speakGroceryCharacter()');assert.equal(spoken,null);
assert(nodes.get('conversation-feedback').textContent.includes('No voice'));
run('appState.syncCode="9999";renderConversationLanding()');assert.equal(run('groceryConversation'),null);
run('learningLanguage="es";renderConversationLanding()');assert.equal(nodes.get('conversation-start').disabled,true);
console.log('PASS: conversation controls, stale-click protection, results, hints, RTL, audio, language and learner changes.');

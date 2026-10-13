const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const context=vm.createContext({learningLanguage:'fr',appState:{syncCode:'1234'}});
const run=source=>vm.runInContext(source,context);
for(const name of ['data/conversations/groceries.js','conversation-engine.js']) run(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
const data=run('groceryDialogue');
let paths=0;
function walk(language,level,choices=[]){
  run(`startGroceryConversation('${language}','${level}');`);
  for(const id of choices) assert.equal(run(`advanceGroceryConversation('${id}')`),true);
  const state=run('groceryConversation');
  if(state.complete){
    assert.equal(run('groceryGoals().filter(goal=>goal[1]).length'),5);
    const total=state.quantity*(language==='ar'?3:2)+(state.milk?2:0);
    assert.equal(run('groceryTotal()'),total);
    const checkout=state.transcript.find(t=>t.speaker==='character'&&t.line[2].includes('Will you pay'));
    assert(checkout.line[2].includes(`${total} `));
    assert.equal(run('advanceGroceryConversation("bye")'),false,'finished scenes cannot accept more replies');
    paths++;return;
  }
  assert(choices.length<12,'all branches must terminate');
  for(const choice of data[state.node].choices) walk(language,level,[...choices,choice.id]);
}
for(const language of ['fr','ar']) for(const level of ['easy','medium','hard']) walk(language,level);
for(const language of ['fr','ar']){
  run(`startGroceryConversation('${language}','medium');`);
  for(const [node,content] of Object.entries(data).filter(([key])=>!['title','character'].includes(key))){
    run(`groceryConversation.node='${node}'`);
    for(const choice of content.choices){
      const locale=language==='ar'?1:0;
      for(const text of [choice.text[locale],...choice.aliases[locale]])
        assert.equal(run(`matchGroceryReply(${JSON.stringify(text)})?.id`),choice.id,`${language}/${node}/${text}`);
    }
  }
}
run('startGroceryConversation("fr","medium")');
assert.equal(run('matchGroceryReply("Je ne veux pas de pommes")'),null,'do not accept negated requests');
assert.equal(run('matchGroceryReply("I want apples")'),null,'English does not count as a French reply');
assert.equal(run('matchGroceryReply("<script>alert(1)</script>")'),null);
assert.equal(run('advanceGroceryConversation("fake")'),false);
assert.equal(run('groceryConversation.turns'),0);
run('advanceGroceryConversation("apples");');
assert.equal(run('matchGroceryReply("Je voudrais un kilo de pommes, s’il vous plaît.")?.id'),'one');
run('markGroceryHelp("reply");advanceGroceryConversation("one", "Un kilo");');
assert.equal(run('groceryConversation.independent'),0);
run('advanceGroceryConversation("done", "Non merci");');
assert.equal(run('groceryConversation.independent'),1);
run('appState.syncCode="9999";');
assert.equal(run('advanceGroceryConversation("price")'),false,'do not mix learners');
assert.equal(run('startGroceryConversation("es","easy")'),false);
assert.equal(run('startGroceryConversation("fr","unknown")'),false);
console.log(`PASS: ${paths} complete branches, totals, goals, accepted variants, negation guards, hints and learner isolation.`);

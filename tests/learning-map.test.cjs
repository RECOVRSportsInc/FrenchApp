const assert=require('node:assert/strict'),setup=require('./course-fixture.cjs');
class Element{
 constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.attrs={};}
 append(...nodes){this.children.push(...nodes);}appendChild(node){this.children.push(node);}replaceChildren(){this.children=[];}
 setAttribute(key,value){this.attrs[key]=value;}focus(){}querySelectorAll(){return [];}
}
const grid=new Element(),road=new Element(),body=new Element();
const {run,read}=setup({document:{body,getElementById:id=>id==='topic-grid'?grid:id==='topic-roadmap'?road:null,createElement:()=>new Element(),querySelectorAll:()=>[]}});
run(read('learning-map.js'));run(read('learning/roadmap-ui.js'));run('renderLearningMap()');
assert.equal(grid.children.length,8);
assert.equal(grid.children[0].children.at(-1).textContent,'0 / 3 tiers cleared');
let tier=road.children[2];assert.equal(tier.children[2].children[0].children[0].disabled,false);
assert.equal(tier.children[2].children[1].children[0].disabled,true);
assert.equal(tier.children[3].disabled,false,'test-out bypasses lesson prerequisites');
assert.equal(road.children[3].children[3].disabled,true,'medium starts locked');
run('prepareCourseSession("sports",0);courseSession.correct=15;courseSession.index=20;saveRoadmapResult(courseSession);learningMapSelection="sports";renderLearningMap();');
assert.equal(grid.children[2].children.at(-1).textContent,'1 / 3 tiers cleared');
tier=road.children[2];assert(tier.children[2].children.every(row=>row.className.includes('skipped')));
assert.equal(road.children[3].children[3].disabled,false);
run('learningLanguage="ar";renderLearningMap()');
assert.equal(grid.children[7].children.at(-2).textContent,'Expressions (MSA)');
assert.equal(grid.children[2].children.at(-1).textContent,'0 / 3 tiers cleared');
console.log('PASS: eight topics, real tier progress, ordered stops, test-out gates, skipped lessons and independent Arabic path.');

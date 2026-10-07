const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.attrs={};}
  appendChild(node){this.children.push(node);}append(...nodes){this.children.push(...nodes);}
  replaceChildren(){this.children=[];}setAttribute(key,value){this.attrs[key]=value;}
  querySelectorAll(){return this.children.filter(child=>child.dataset.topic);}focus(){}
}
const grid=new Element(),body=new Element();let chosen=null;
const context=vm.createContext({
  document:{activeElement:null,body,getElementById:id=>id==='topic-grid'?grid:null,
    createElement:()=>new Element(),querySelectorAll:()=>[]},
  readWordHistory:()=>({data:{pairs:{'fr:en':{one:{correct:1}}}}}),
  currentHistoryPair:()=> 'fr:en',
  getPracticeLibrary:()=>[{id:'one',categories:['work'],text:'A',answer:'B'},
    {id:'two',categories:['work'],text:'C',answer:'D'}],
  categoriesFor:row=>row.categories,levelFor:()=> 'easy',
  normalizeMeaning:value=>value.toLowerCase(),questionTextFor:row=>row.text,
  translationFor:row=>row.answer,
  contentCategories:{work:'Work',healthcare:'Healthcare',sports:'Sports',travel:'Travel',home:'Home',gym:'Gym',phrases:'Phrases',slang:'Casual'},
  contentLevels:{all:'All levels',easy:'Easy'},practiceLevel:'easy',practiceMode:'vocabulary',
  practiceCategory:'all',learningLanguage:'fr',answerLanguage:'en',
  appState:{tabActive:true,switchingCode:false},
  selectPractice:(mode,level,category)=>{chosen={mode,level,category};}
});
const run=source=>vm.runInContext(source,context);
run(fs.readFileSync(require('node:path').join(__dirname,'../learning-map.js'),'utf8'));
run('renderLearningMap()');
assert.equal(grid.children.filter(node=>node.dataset.topic).length,8);
assert.equal(grid.children[0].children.at(-1).textContent,'1 / 2 correct');
assert.equal(grid.children[2].className,'topic-detail','Detail panel follows the selected row');
grid.children[2].children.at(-1).onclick();
assert.deepEqual(chosen,{mode:'vocabulary',level:'easy',category:'work'});
assert.equal(body.dataset.learningView,'practice');
run("learningLanguage='ar';practiceCategory='slang';renderLearningMap()");
const casual=grid.children.find(node=>node.dataset.topic==='slang');
assert.equal(casual.children.at(-2).textContent,'Everyday expressions');
console.log('PASS: eight topics, real progress, row details, practice selection and Arabic category label.');

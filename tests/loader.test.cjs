const fs = require('node:fs'), vm = require('node:vm');
const path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'bank-loader.js'), 'utf8');
function setup() {
  const requests = [];
  const context = vm.createContext({
    document: { createElement: () => ({}), head: { appendChild: script => requests.push(script) } }
  });
  vm.runInContext('const addedContent=[], vocabulary=[], sentences=[];', context);
  vm.runInContext(source, context);
  return { requests, context, run: text => vm.runInContext(text, context) };
}
(async () => {
  const success = setup();
  assert.equal(success.requests.length, 52);
  let ready = false;
  const promise = success.run('expandedBanksReady').then(() => { ready = true; });
  for (const script of success.requests.slice(0, -1)) {
    const file = script.src.split('?')[0];
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), success.context);
    script.onload();
  }
  await Promise.resolve();
  assert.equal(ready, false, 'Must wait for the last file');
  assert.equal(success.run('vocabulary.length'), 0, 'Do not install a partial bank');
  const last = success.requests.at(-1);
  vm.runInContext(fs.readFileSync(path.join(root, last.src.split('?')[0]), 'utf8'), success.context);
  last.onload();
  await promise;
  success.run('installExpandedContent(); installExpandedContent();');
  assert.equal(success.run('vocabulary.length'), 2420);
  assert.equal(success.run('sentences.length'), 2420);
  assert.equal(success.run('addedContent.length'), 4840);
  const failure = setup();
  failure.requests[0].onerror();
  await assert.rejects(failure.run('expandedBanksReady'), /could not be loaded/);
  assert.equal(failure.run('vocabulary.length'), 0);
  console.log('PASS: complete loading, atomic installation, duplicate-install protection and load failure.');
})().catch(error => { console.error(error); process.exitCode = 1; });

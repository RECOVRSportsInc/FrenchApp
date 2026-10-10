// Load small, independent banks before the first question is created.
const expandedContent = [];
const BANK_VERSION = "20261010-1";
const expandedBankFiles = [
  "data/expressions/phrases-easy.js",
  "data/expressions/phrases-medium.js",
  "data/expressions/phrases-hard.js",
  "data/expressions/slang-easy.js",
  "data/expressions/slang-medium.js",
  "data/expressions/slang-hard.js",

  "data/banks/work/medium-vocabulary.js",
  "data/banks/work/medium-sentences.js",
  "data/banks/work/hard-vocabulary.js",
  "data/banks/work/hard-sentences.js",
  "data/banks/healthcare/easy-vocabulary.js",
  "data/banks/healthcare/easy-sentences.js",
  "data/banks/healthcare/medium-vocabulary.js",
  "data/banks/healthcare/medium-sentences.js",
  "data/banks/healthcare/hard-vocabulary.js",
  "data/banks/healthcare/hard-sentences.js",
  "data/banks/sports/easy-vocabulary.js",
  "data/banks/sports/easy-sentences.js",
  "data/banks/sports/medium-vocabulary.js",
  "data/banks/sports/medium-sentences.js",
  "data/banks/sports/hard-vocabulary.js",
  "data/banks/sports/hard-sentences.js",
  "data/banks/travel/easy-vocabulary.js",
  "data/banks/travel/easy-sentences.js",
  "data/banks/travel/medium-vocabulary.js",
  "data/banks/travel/medium-sentences.js",
  "data/banks/travel/hard-vocabulary.js",
  "data/banks/travel/hard-sentences.js",
  "data/banks/home/easy-vocabulary.js",
  "data/banks/home/easy-sentences.js",
  "data/banks/home/medium-vocabulary.js",
  "data/banks/home/medium-sentences.js",
  "data/banks/home/hard-vocabulary.js",
  "data/banks/home/hard-sentences.js",
  "data/banks/gym/easy-vocabulary.js",
  "data/banks/gym/easy-sentences.js",
  "data/banks/gym/medium-vocabulary.js",
  "data/banks/gym/medium-sentences.js",
  "data/banks/gym/hard-vocabulary.js",
  "data/banks/gym/hard-sentences.js",
  "data/banks/phrases/easy-vocabulary.js",
  "data/banks/phrases/easy-sentences.js",
  "data/banks/phrases/medium-vocabulary.js",
  "data/banks/phrases/medium-sentences.js",
  "data/banks/phrases/hard-vocabulary.js",
  "data/banks/phrases/hard-sentences.js",
  "data/banks/slang/easy-vocabulary.js",
  "data/banks/slang/easy-sentences.js",
  "data/banks/slang/medium-vocabulary.js",
  "data/banks/slang/medium-sentences.js",
  "data/banks/slang/hard-vocabulary.js",
  "data/banks/slang/hard-sentences.js",
];
let expandedContentInstalled = false;
const expandedBanksReady = Promise.all(expandedBankFiles.map(path =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${path}?v=${BANK_VERSION}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("The practice bank could not be loaded. Check your connection and reload."));
    document.head.appendChild(script);
  })
));
// Register a rejection handler immediately, even if boot has not reached initApp.
expandedBanksReady.catch(() => {});
function installExpandedContent() {
  if (expandedContentInstalled) return;
  addedContent.push(...expandedContent);
  vocabulary.push(...expandedContent.filter(row => row.mode === "vocabulary"));
  sentences.push(...expandedContent.filter(row => row.mode === "sentences"));
  expandedContentInstalled = true;
}

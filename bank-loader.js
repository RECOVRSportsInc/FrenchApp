// Load small, independent banks before the first question is created.
const expandedContent = [];
const BANK_VERSION = document.querySelector('meta[name="app-release"]')?.content || "20261013-3";
const expandedBankFiles = [
  "data/banks/work/medium-vocabulary.js",
  "data/banks/work/hard-vocabulary.js",
  "data/banks/healthcare/easy-vocabulary.js",
  "data/banks/healthcare/medium-vocabulary.js",
  "data/banks/healthcare/hard-vocabulary.js",
  "data/banks/sports/easy-vocabulary.js",
  "data/banks/sports/medium-vocabulary.js",
  "data/banks/sports/hard-vocabulary.js",
  "data/banks/travel/easy-vocabulary.js",
  "data/banks/travel/medium-vocabulary.js",
  "data/banks/travel/hard-vocabulary.js",
  "data/banks/home/easy-vocabulary.js",
  "data/banks/home/medium-vocabulary.js",
  "data/banks/home/hard-vocabulary.js",
  "data/banks/gym/easy-vocabulary.js",
  "data/banks/gym/medium-vocabulary.js",
  "data/banks/gym/hard-vocabulary.js",
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

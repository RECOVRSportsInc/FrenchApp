const fs = require('node:fs'), path = require('node:path');
const raw = process.argv[2];
let url;
try {
  url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
} catch {
  console.error('Usage: node scripts/configure-learning-cloud.cjs https://YOUR-WORKER.workers.dev');
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, '..', 'progress-sync/config.js'),
  '// Public Worker address. No provider credentials belong here.\nwindow.learningSyncConfig = ' + JSON.stringify({endpoint: url.origin}) + ';\n');
console.log('Learning sync address configured. Run scripts/version-release.cjs with a new release ID before publishing.');

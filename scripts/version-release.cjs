// Run before committing changes to any browser-loaded file.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const release = process.argv[2];
if (!release || !/^[a-zA-Z0-9_-]+$/.test(release)) {
  console.error('Usage: node scripts/version-release.cjs 20261013-3');
  process.exit(1);
}
const index = path.join(root, 'index.html');
const html = fs.readFileSync(index, 'utf8')
  .replace(/(<meta name="app-release" content=")[^"]+(">)/, (_match, before, after) => before + release + after)
  .replace(/((?:src|href)="[^"?]+\.(?:js|css))\?v=[^"&]+/g, (_match, asset) => asset + "?v=" + release);
fs.writeFileSync(index, html);
const loader = path.join(root, 'bank-loader.js');
fs.writeFileSync(loader, fs.readFileSync(loader, 'utf8')
  .replace(/(\|\| ")[^"]+(";)/, (_match, before, after) => before + release + after));
console.log(`Browser assets now use release ${release}.`);

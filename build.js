#!/usr/bin/env node
// Keeps the generated files in sync with their sources of truth:
//   - package.json "version"  -> tolltop.js banner + the version pin in README.md and llms.txt
//   - tolltop.css             -> the embedded CSS const in tolltop.js used for self-injection
// Run via `npm run build`; also runs automatically on `prepublishOnly`.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const jsPath = path.join(dir, 'tolltop.js');

const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
const css = fs
  .readFileSync(path.join(dir, 'tolltop.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '') // strip comments
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,])\s*/g, '$1') // drop space around structural chars, keep it inside values
  .trim()
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

let js = fs.readFileSync(jsPath, 'utf8');
const before = js;

js = js.replace(/tolltop v\d+\.\d+\.\d+/, 'tolltop v' + pkg.version);
js = js.replace(/const CSS = `[^`]*`;/, () => 'const CSS = `' + css + '`;');

if (!/tolltop v\d+\.\d+\.\d+/.test(js)) throw new Error('build: version banner not found in tolltop.js');
if (!/const CSS = `[^`]*`;/.test(js)) throw new Error('build: CSS const not found in tolltop.js');

if (js !== before) {
  fs.writeFileSync(jsPath, js);
  console.log('tolltop.js synced: v' + pkg.version + ', CSS ' + css.length + ' chars');
} else {
  console.log('tolltop.js already in sync: v' + pkg.version);
}

for (const name of ['README.md', 'llms.txt']) {
  const docPath = path.join(dir, name);
  const doc = fs.readFileSync(docPath, 'utf8');
  const synced = doc.replace(/tolltop@\d+\.\d+\.\d+/g, 'tolltop@' + pkg.version);

  if (!/tolltop@\d+\.\d+\.\d+/.test(synced)) throw new Error('build: version pin not found in ' + name);

  if (synced !== doc) {
    fs.writeFileSync(docPath, synced);
    console.log(name + ' synced: v' + pkg.version);
  } else {
    console.log(name + ' already in sync: v' + pkg.version);
  }
}

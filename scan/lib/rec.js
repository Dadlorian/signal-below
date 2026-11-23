'use strict';
// CLI bridge for bash checks.
//   node rec.js rec  STATUS ID CLASS TITLE SUMMARY [EVIDENCE_FILE]   -> records one result and prints the terminal line
//   node rec.js meta KEY JSON                                         -> records a scan counter
const fs = require('fs');
const C = require('./common');
const [mode, ...a] = process.argv.slice(2);
if (mode === 'rec') {
  const [status, id, cls, title, summary, evFile] = a;
  let evidence = [];
  if (evFile && fs.existsSync(evFile)) evidence = fs.readFileSync(evFile, 'utf8').split('\n').filter((l) => l.trim());
  C.emit({ id, cls, title, status, summary, evidence });
} else if (mode === 'meta') {
  const [key, json] = a;
  let v; try { v = JSON.parse(json); } catch { v = json; }
  C.meta(key, v);
} else {
  console.error('usage: rec.js rec|meta ...'); process.exit(2);
}

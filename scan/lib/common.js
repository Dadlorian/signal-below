'use strict';
// Shared helpers for the scanner's node modules. Pure file reading; never executes project code.
const fs = require('fs');
const path = require('path');

const RESULTS = process.env.SCAN_RESULTS || '';
const META = process.env.SCAN_META || '';
const TERM_LINES = parseInt(process.env.SCAN_TERM_LINES || '8', 10);

// Record one check result. status: PASS | WARN | FAIL | INFO | SKIP
// cls: 'critical' (supply chain / secrets / config: a WARN here means MEDIUM risk)
//      'hygiene'  (code quality / exposure notes: a WARN here keeps LOW risk but is listed)
function emit(r) {
  const rec = { id: '?', title: '', cls: 'hygiene', status: 'INFO', summary: '', evidence: [], ...r };
  rec.evidence = (rec.evidence || []).map(String);
  if (RESULTS) fs.appendFileSync(RESULTS, JSON.stringify(rec) + '\n');
  const tag = rec.status.padEnd(4);
  console.log(`  ${tag}  [${rec.id}] ${rec.title}: ${rec.summary}`);
  const show = rec.status === 'PASS' ? Math.min(TERM_LINES, 3) : TERM_LINES;
  rec.evidence.slice(0, show).forEach((e) => console.log(`          ${e}`));
  if (rec.evidence.length > show) console.log(`          ... +${rec.evidence.length - show} more (see report)`);
  return rec;
}

function meta(key, value) {
  if (META) fs.appendFileSync(META, JSON.stringify({ key, value }) + '\n');
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function tryReadJSON(file) {
  try { return readJSON(file); } catch { return null; }
}

// Glob -> RegExp. ** matches across '/', * within a segment, ? one char.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

// allowlist.txt lines: kind|pattern|reason|YYYY-MM-DD  (# comments, blank lines ignored)
function loadAllowlist(file) {
  const out = [];
  if (!file || !fs.existsSync(file)) return out;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const parts = t.split('|');
    if (parts.length < 3) { console.error(`allowlist: line ${i + 1} malformed (need kind|pattern|reason|date)`); return; }
    const [kind, pattern, reason, date] = parts.map((s) => s.trim());
    out.push({ kind, pattern, reason, date: date || '', re: globToRegExp(pattern), line: i + 1, used: 0 });
  });
  return out;
}

// Returns the matching allowlist entry (and marks it used) or null.
function allowed(allowlist, kind, value) {
  for (const a of allowlist) {
    if (a.kind !== kind) continue;
    if (a.re.test(value)) { a.used++; return a; }
  }
  return null;
}

// Recursive file walk. Returns [{path, rel, size, mode, isSymlink}]. Never follows symlinks.
function walk(root, opts = {}) {
  const skipDirs = new Set(opts.skipDirs || ['.git']);
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isSymbolicLink()) { out.push({ path: p, rel: path.relative(root, p), size: 0, isSymlink: true }); continue; }
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) stack.push(p); continue; }
      if (!e.isFile()) continue;
      let st; try { st = fs.statSync(p); } catch { continue; }
      out.push({ path: p, rel: path.relative(root, p), size: st.size, mode: st.mode, isSymlink: false });
    }
  }
  return out;
}

function isProbablyText(buf) {
  const n = Math.min(buf.length, 4096);
  for (let i = 0; i < n; i++) { const b = buf[i]; if (b === 0) return false; }
  return true;
}

function readTextBounded(file, maxBytes) {
  const st = fs.statSync(file);
  if (st.size > maxBytes) return null;
  const buf = fs.readFileSync(file);
  if (!isProbablyText(buf)) return null;
  return buf.toString('utf8');
}

function trunc(s, n = 160) {
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function arg(name, def) {
  const i = process.argv.indexOf(name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith('--')) return true;
  return v;
}
function flag(name) { return process.argv.includes(name); }

module.exports = { emit, meta, readJSON, tryReadJSON, globToRegExp, loadAllowlist, allowed, walk, readTextBounded, isProbablyText, trunc, arg, flag };

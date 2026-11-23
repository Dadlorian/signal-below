'use strict';
// Lockfile checks. Usage: node lockfile.js --lock <path/to/package-lock.json> [--repo <git root>] [--allowlist file]
// Emits checks 3 (sources+integrity), 10 (lookalike names), 12 (diff vs HEAD), 13 (node_modules drift).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const C = require('./common');
const { POPULAR, POPULAR_SCOPES, LURE_RE } = require('./iocs');

const lockPath = path.resolve(C.arg('--lock'));
const repo = path.resolve(C.arg('--repo', process.cwd()));
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const relLock = path.relative(repo, lockPath);
const dir = path.dirname(lockPath);
const lock = C.readJSON(lockPath);
const pkgs = lock.packages || {};
const nameOf = (key, e) => e.name || key.replace(/^.*node_modules\//, '');
const entries = Object.entries(pkgs).filter(([k]) => k !== '');

C.meta('lockfile.' + relLock, { lockfileVersion: lock.lockfileVersion, entries: entries.length });

// ---- 3. Every entry resolved from registry.npmjs.org with sha512 integrity ---------------------------
{
  const fail = [], warn = [], info = [];
  for (const [k, e] of entries) {
    const n = nameOf(k, e);
    if (e.link) { fail.push(`${k}: link entry -> ${e.resolved || '?'} (symlinked local package)`); continue; }
    if (e.inBundle) { info.push(`${k}: bundled inside its parent tarball (no own resolved/integrity; normal)`); continue; }
    if (!e.resolved) { fail.push(`${k}@${e.version}: no "resolved" URL`); }
    else if (/^https:\/\/registry\.npmjs\.org\//.test(e.resolved)) { /* ok */ }
    else if (/^http:\/\//.test(e.resolved)) fail.push(`${k}: insecure http:// source ${e.resolved}`);
    else if (/^(git\+|git:|github:|ssh:)/.test(e.resolved) || /\.git(#|$)/.test(e.resolved)) fail.push(`${k}: git source ${e.resolved}`);
    else if (/^file:/.test(e.resolved)) fail.push(`${k}: local file source ${e.resolved}`);
    else fail.push(`${k}: non-npmjs source ${e.resolved}`);
    if (e.resolved && !e.link) {
      if (!e.integrity) fail.push(`${k}@${e.version}: no integrity hash`);
      else if (!/^sha512-/.test(e.integrity)) warn.push(`${k}@${e.version}: weak integrity (${e.integrity.split('-')[0]})`);
    }
    if (e.name && e.name !== k.replace(/^.*node_modules\//, '')) warn.push(`${k}: alias of ${e.name}@${e.version} (npm: alias; check it is intentional)`);
    // the resolved tarball should belong to the package of the same name
    if (e.resolved && /^https:\/\/registry\.npmjs\.org\//.test(e.resolved)) {
      const m = e.resolved.match(/^https:\/\/registry\.npmjs\.org\/(.+?)\/-\/[^/]+\.tgz$/);
      if (!m) warn.push(`${k}: unusual tarball URL ${e.resolved}`);
      else if (m[1] !== n) fail.push(`${k}: tarball URL is for a different package (${m[1]}) ${e.resolved}`);
    }
  }
  // root dependency specs with npm: aliases or non-registry protocols
  const root = pkgs[''] || {};
  for (const sec of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [n, v] of Object.entries(root[sec] || {})) {
      if (/^npm:/.test(v)) warn.push(`root ${sec} ${n} = ${v} (alias)`);
      if (/^(git|github:|https?:|file:|link:|workspace:|catalog:)/.test(v)) fail.push(`root ${sec} ${n} = ${v} (non-registry spec)`);
    }
  }
  const status = fail.length ? 'FAIL' : warn.length ? 'WARN' : 'PASS';
  C.emit({ id: '3', cls: 'critical', title: 'Lockfile sources and integrity', status,
    summary: status === 'PASS' ? `all ${entries.length} entries resolve to https://registry.npmjs.org with sha512 integrity` : `${fail.length} failing, ${warn.length} warnings across ${entries.length} entries`,
    evidence: [...fail.map((s) => 'FAIL ' + s), ...warn.map((s) => 'WARN ' + s), ...info.slice(0, 5)] });
}

// ---- 10. Lookalike / typosquat names --------------------------------------------------------------
function dlDistance(a, b) { // Damerau-Levenshtein (optimal string alignment)
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}
const HOMOGLYPH = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', 'vv': 'w', 'rn': 'm' };
function deHomoglyph(s) { let t = s; for (const [k, v] of Object.entries(HOMOGLYPH)) t = t.split(k).join(v); return t; }
{
  const popular = new Set(POPULAR);
  const hits = [], lure = [];
  const names = [...new Set(entries.map(([k, e]) => nameOf(k, e)))];
  for (const name of names) {
    if (C.allowed(allowlist, 'pkg-name', name)) continue;
    if (/[^\x20-\x7e]/.test(name)) { hits.push(`${name}: non-ASCII characters in package name`); continue; }
    if (popular.has(name)) continue;
    const scope = name.startsWith('@') ? name.split('/')[0] : null;
    const base = name.startsWith('@') ? name.split('/')[1] : name;
    const reasons = [];
    for (const p of POPULAR) {
      if (p === name) continue;
      const pBase = p.startsWith('@') ? p.split('/')[1] : p;
      const pScope = p.startsWith('@') ? p.split('/')[0] : null;
      // full-name edit distance (length-aware so short names do not spam)
      const L = Math.max(name.length, p.length);
      const maxD = L >= 8 ? 2 : L >= 5 ? 1 : 0;
      if (maxD) {
        const d = dlDistance(name, p);
        if (d > 0 && d <= maxD) reasons.push(`edit distance ${d} from popular "${p}"`);
        const dh = dlDistance(deHomoglyph(name), p);
        if (dh === 0 && name !== p) reasons.push(`homoglyph of "${p}"`);
      }
      // scope confusion: unscoped "babel-core" vs "@babel/core"; "types-node" vs "@types/node"
      if (!scope && pScope) {
        const flat = pScope.slice(1) + '-' + pBase;
        const flat2 = pScope.slice(1) + '_' + pBase;
        if (name === flat || name === flat2) reasons.push(`unscoped imitation of "${p}"`);
      }
      // same base as a popular scoped package but under a different, lookalike scope
      if (scope && pScope && base === pBase && scope !== pScope) {
        const ds = dlDistance(scope, pScope);
        if (ds <= 2) reasons.push(`scope "${scope}" resembles "${pScope}" (${p})`);
      }
    }
    if (scope && !POPULAR_SCOPES.includes(scope)) {
      for (const ps of POPULAR_SCOPES) {
        const ds = dlDistance(scope, ps);
        if (ds > 0 && ds <= 1) reasons.push(`scope "${scope}" is 1 edit from "${ps}"`);
        // "@types-node/core", "@babel_core/x": a popular scope with a suffix glued on, imitating "@types/node"
        if (scope.startsWith(ps + '-') || scope.startsWith(ps + '_') || scope.startsWith(ps + '.')) reasons.push(`scope "${scope}" imitates "${ps}" (looks like ${ps}/${scope.slice(ps.length + 1)})`);
      }
    }
    if (reasons.length) hits.push(`${name}: ${[...new Set(reasons)].join('; ')}`);
    if (LURE_RE.test(name)) lure.push(`${name}: name contains an install-lure/security word`);
  }
  const status = hits.length || lure.length ? 'WARN' : 'PASS';
  C.emit({ id: '10', cls: 'critical', title: 'Lookalike (typosquat) package names', status,
    summary: status === 'PASS' ? `no lookalikes of ${POPULAR.length} well-known names among ${names.length} package names` : `${hits.length} lookalike + ${lure.length} lure-word names need a human look`,
    evidence: [...hits, ...lure] });
}

// ---- 12. Lockfile and package.json diff vs git HEAD ------------------------------------------------
function gitShow(rel) {
  try { return execFileSync('git', ['show', 'HEAD:' + rel], { cwd: repo, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); }
  catch { return null; }
}
{
  const oldTxt = gitShow(relLock);
  const ev = [];
  let status = 'INFO', summary = '';
  if (oldTxt === null) { summary = 'lockfile is not in git HEAD (new file), nothing to compare'; status = 'WARN'; }
  else {
    let old; try { old = JSON.parse(oldTxt).packages || {}; } catch { old = null; }
    if (!old) { summary = 'HEAD lockfile unparsable'; status = 'WARN'; }
    else {
      const added = [], removed = [], changed = [];
      for (const [k, e] of entries) {
        if (!old[k]) added.push(`${nameOf(k, e)}@${e.version}`);
        else if (old[k].version !== e.version) {
          const a = old[k].version, b = e.version;
          const majA = parseInt(a, 10), majB = parseInt(b, 10);
          changed.push(`${nameOf(k, e)} ${a} -> ${b}${majB < majA ? ' (MAJOR DOWNGRADE)' : majB > majA ? ' (major upgrade)' : ''}`);
        }
        else if (old[k].resolved !== e.resolved || old[k].integrity !== e.integrity) changed.push(`${nameOf(k, e)}@${e.version}: same version but different resolved/integrity (tarball changed!)`);
      }
      for (const k of Object.keys(old)) if (k && !pkgs[k]) removed.push(`${nameOf(k, old[k])}@${old[k].version}`);
      const same = !added.length && !removed.length && !changed.length;
      summary = same ? 'lockfile identical to the last commit' : `${added.length} added, ${removed.length} removed, ${changed.length} changed vs HEAD`;
      if (changed.some((s) => s.includes('tarball changed'))) status = 'FAIL';
      ev.push(...changed.map((s) => 'CHANGED ' + s), ...added.map((s) => 'ADDED ' + s), ...removed.map((s) => 'REMOVED ' + s));
      C.meta('lockdiff.' + relLock, { added: added.length, removed: removed.length, changed: changed.length });
    }
  }
  // package.json spec diff
  const relPkg = path.join(path.dirname(relLock), 'package.json');
  const oldPkgTxt = gitShow(relPkg);
  const curPkg = C.tryReadJSON(path.join(dir, 'package.json')) || {};
  if (oldPkgTxt) {
    let oldPkg = null; try { oldPkg = JSON.parse(oldPkgTxt); } catch { ev.push('package.json at HEAD is not valid JSON'); }
    if (oldPkg) {
      for (const sec of ['dependencies', 'devDependencies', 'optionalDependencies', 'scripts']) {
        const a = oldPkg[sec] || {}, b = curPkg[sec] || {};
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
          if (a[k] === b[k]) continue;
          ev.push(`package.json ${sec}.${k}: ${a[k] === undefined ? '(none)' : JSON.stringify(a[k])} -> ${b[k] === undefined ? '(removed)' : JSON.stringify(b[k])}`);
        }
      }
      for (const k of new Set([...Object.keys(oldPkg), ...Object.keys(curPkg)])) {
        if (['dependencies', 'devDependencies', 'optionalDependencies', 'scripts'].includes(k)) continue;
        if (JSON.stringify(oldPkg[k]) !== JSON.stringify(curPkg[k])) ev.push(`package.json field "${k}" changed: ${JSON.stringify(oldPkg[k])} -> ${JSON.stringify(curPkg[k])}`);
      }
    }
  }
  C.emit({ id: '12', cls: 'critical', title: 'What the dependency update changed (vs last commit)', status, summary, evidence: ev });
}

// ---- 13. Drift between package-lock.json and what is actually installed in node_modules --------------
{
  const nmLock = path.join(dir, 'node_modules', '.package-lock.json');
  const nmDir = path.join(dir, 'node_modules');
  if (!fs.existsSync(nmDir)) {
    C.emit({ id: '13', cls: 'critical', title: 'Installed node_modules vs lockfile', status: 'INFO', summary: 'no node_modules present (nothing installed yet)', evidence: [] });
  } else {
    const installed = C.tryReadJSON(nmLock);
    const ev = [];
    let status = 'PASS';
    var differs = [];
    if (!installed) { status = 'WARN'; ev.push('node_modules exists but node_modules/.package-lock.json is missing or unreadable (not installed by npm 7+?)'); }
    else {
      const ip = installed.packages || {};
      let missing = 0, extra = 0, differ = 0;
      for (const [k, e] of entries) {
        if (e.link || e.inBundle) continue;
        if (/\boptional\b/.test(Object.keys(e).filter((x) => e[x] === true).join(' ')) && !ip[k] && !fs.existsSync(path.join(dir, k))) continue; // optional deps may legitimately be absent
        if (!ip[k]) { missing++; ev.push(`MISSING  ${nameOf(k, e)}@${e.version} (in lockfile, not installed)`); }
        else if (ip[k].version !== e.version) { differ++; ev.push(`DIFFERS  ${nameOf(k, e)}: installed ${ip[k].version}, lockfile ${e.version}`); }
        else if (ip[k].integrity && e.integrity && ip[k].integrity !== e.integrity) { differ++; ev.push(`DIFFERS  ${nameOf(k, e)}@${e.version}: installed integrity differs from lockfile`); }
      }
      for (const k of Object.keys(ip)) { if (k && !pkgs[k] && !ip[k].inBundle) { extra++; ev.push(`EXTRA    ${nameOf(k, ip[k])}@${ip[k].version} (installed, not in lockfile)`); } }
      // directories on disk that no lockfile knows about
      let unknown = 0;
      const seen = new Set(Object.keys(ip));
      const scanDir = (d, prefix) => {
        let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
        for (const en of ents) {
          if (!en.isDirectory() || en.name.startsWith('.')) continue;
          if (en.name.startsWith('@')) { scanDir(path.join(d, en.name), prefix + en.name + '/'); continue; }
          const key = prefix + en.name;
          if (fs.existsSync(path.join(d, en.name, 'package.json')) && !seen.has(key)) { unknown++; ev.push(`UNKNOWN  ${key} on disk but in neither lockfile`); }
        }
      };
      scanDir(nmDir, 'node_modules/');
      C.meta('node_modules.' + relLock, { installedEntries: Object.keys(ip).length - (ip[''] ? 1 : 0), missing, differ, extra, unknown });
      if (missing || differ || extra || unknown) status = 'WARN';
      // version differences first: they name the packages a human cares about (e.g. vite 8.3.8 installed vs 6.4.6 locked)
      ev.sort((a, b) => (a.startsWith('DIFFERS') ? 0 : 1) - (b.startsWith('DIFFERS') ? 0 : 1));
      let nmAge = '';
      try { nmAge = `; node_modules/.package-lock.json written ${fs.statSync(nmLock).mtime.toISOString().slice(0, 10)}, package-lock.json ${fs.statSync(lockPath).mtime.toISOString().slice(0, 10)}`; } catch { /* ignore */ }
      ev.unshift(`installed: ${Object.keys(ip).length - 1} packages; lockfile: ${entries.length}; version-differs ${differ}, missing ${missing}, extra ${extra}, unknown-on-disk ${unknown}${nmAge}`);
      if (status === 'WARN') ev.push('Meaning: this node_modules is STALE. "npm run dev" would run the INSTALLED versions, not the ones that were scanned and audited. Discard it and rebuild from the lockfile inside the container (scan/contained-install.sh); never reuse or copy it.');
      var differs = ev.filter((e) => e.startsWith('DIFFERS')).map((e) => e.replace(/^DIFFERS\s+/, '').replace(/: installed /, ' installed ').replace(/, lockfile /, ' vs lockfile ')).slice(0, 3);
    }
    C.emit({ id: '13', cls: 'critical', title: 'Installed node_modules vs lockfile', status,
      summary: status === 'PASS' ? 'installed tree matches the lockfile' : status === 'WARN' ? `installed tree is stale / does not match the lockfile${differs && differs.length ? ': ' + differs.join('; ') : ''}` : 'checked', evidence: ev });
  }
}

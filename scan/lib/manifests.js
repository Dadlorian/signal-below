'use strict';
// package.json / lockfile manifest checks 4 (install scripts), 5 (unpinned specs), 6 (package.json vs lockfile sync).
// Usage: node manifests.js --repo root --allowlist f  (file list on stdin)
const fs = require('fs');
const path = require('path');
const C = require('./common');
const { LIFECYCLE, RULES } = require('./iocs');

const repo = path.resolve(C.arg('--repo', process.cwd()));
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const files = fs.readFileSync(0, 'utf8').split(/\n|\0/).map((s) => s.trim()).filter(Boolean);
const pkgFiles = files.filter((f) => /(^|\/)package\.json$/.test(f) && !/node_modules\//.test(f));
const lockFiles = files.filter((f) => /(^|\/)package-lock\.json$/.test(f) && !/node_modules\//.test(f));
const lockDirs = new Set(lockFiles.map((l) => path.dirname(l)));

// ---- 4. install-time scripts -----------------------------------------------------------------------------
{
  const fail = [], warn = [], ok = [];
  for (const f of pkgFiles) {
    const pj = C.tryReadJSON(path.join(repo, f));
    if (!pj) { warn.push(`${f}: not valid JSON`); continue; }
    const s = pj.scripts || {};
    // npm 11.x "allowScripts": pre-approves install scripts of named dependencies (npm docs: install-scripts). Flag it.
    if (pj.allowScripts !== undefined) warn.push(`${f}: has an "allowScripts" field = ${C.trunc(JSON.stringify(pj.allowScripts), 120)}  [pre-approves dependency install scripts; review each name]`);
    const hits = LIFECYCLE.filter((k) => s[k]);
    if (!hits.length) continue;
    const isInstallRoot = lockDirs.has(path.dirname(f));
    for (const k of hits) {
      const line = `${f} scripts.${k} = ${C.trunc(s[k], 120)}`;
      const ioc = RULES.filter((r) => r.level === 'FAIL').some((r) => r.re.test(s[k]));
      const runsOnInstall = ['preinstall', 'install', 'postinstall', 'prepare', 'dependencies'].includes(k);
      if (ioc || (isInstallRoot && runsOnInstall)) fail.push(line + (ioc ? '  [contains a known-bad pattern]' : '  [runs automatically on npm install in this directory]'));
      else if (isInstallRoot) warn.push(line + '  [runs on npm pack/publish, not on install]');
      else warn.push(line + '  [sub-package; not installed by npm here, but would run if someone installs it]');
    }
  }
  for (const l of lockFiles) {
    const lock = C.tryReadJSON(path.join(repo, l)); if (!lock) { warn.push(`${l}: unreadable`); continue; }
    for (const [k, e] of Object.entries(lock.packages || {})) {
      if (!k || !e.hasInstallScript) continue;
      const name = e.name || k.replace(/^.*node_modules\//, '');
      const a = C.allowed(allowlist, 'install-script', name);
      if (a) ok.push(`${l}: ${name}@${e.version} has an install script (allowlisted: ${a.reason})`);
      else fail.push(`${l}: ${name}@${e.version} (${k}) has an install script that is NOT on the allowlist`);
    }
  }
  const status = fail.length ? 'FAIL' : warn.length ? 'WARN' : 'PASS';
  C.emit({ id: '4', cls: 'critical', title: 'Install-time scripts (package.json and lockfile hasInstallScript)', status,
    summary: status === 'PASS' ? `no lifecycle scripts in ${pkgFiles.length} package.json files; lockfile install scripts only in allowlisted packages (${ok.length})` : `${fail.length} failing, ${warn.length} warning`,
    evidence: [...fail.map((s) => 'FAIL ' + s), ...warn.map((s) => 'WARN ' + s), ...ok.map((s) => 'ok   ' + s)] });
}

// ---- 5. unpinned / non-registry dependency specs ----------------------------------------------------------
{
  const warn = [], info = [];
  for (const f of pkgFiles) {
    const pj = C.tryReadJSON(path.join(repo, f)); if (!pj) continue;
    const isInstallRoot = lockDirs.has(path.dirname(f));
    for (const sec of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [n, v] of Object.entries(pj[sec] || {})) {
        const spec = String(v);
        let why = null;
        if (/^(latest|\*|next|x|)$/.test(spec) || /^[><]=?\s*\d/.test(spec)) why = 'floating version (any/latest)';
        else if (/^(git\+|git:|github:|gitlab:|bitbucket:|https?:|ssh:)/.test(spec) || /\.git(#|$)/.test(spec)) why = 'non-registry source (git/URL)';
        else if (/^(file:|link:)/.test(spec)) why = 'local path source';
        else if (/^npm:/.test(spec)) why = 'alias to another package';
        else if (/^(workspace:|catalog:)/.test(spec)) why = 'pnpm workspace/catalog spec (not installable with npm)';
        if (!why) continue;
        const line = `${f} ${sec}.${n} = "${spec}"  (${why})`;
        const a = isInstallRoot ? C.allowed(allowlist, 'spec', n) : null;
        if (a) info.push(`${line}  (accepted: ${a.reason})`);
        else if (isInstallRoot) warn.push(line); else info.push(line);
      }
    }
    if (pj.overrides || pj.resolutions) warn.push(`${f}: has overrides/resolutions = ${C.trunc(JSON.stringify(pj.overrides || pj.resolutions), 120)} (forces versions; check why)`);
    if (pj.bundleDependencies || pj.bundledDependencies) warn.push(`${f}: bundleDependencies present (code shipped inside the tarball bypasses the registry)`);
  }
  const status = warn.length ? 'WARN' : 'PASS';
  C.emit({ id: '5', cls: 'critical', title: 'Dependency specs (pinning and source)', status,
    summary: status === 'PASS' ? 'all installable specs are registry versions/ranges' : `${warn.length} spec(s) in the installable project are floating or non-registry (lockfile + npm ci still pin them); ${info.length} in non-installed sub-packages`,
    evidence: [...warn.map((s) => 'WARN ' + s), ...info.map((s) => 'info ' + s)] });
}

// ---- 6. package.json vs lockfile root --------------------------------------------------------------------
{
  const ev = []; let status = 'PASS';
  for (const l of lockFiles) {
    const d = path.dirname(l);
    const lock = C.tryReadJSON(path.join(repo, l)); const pj = C.tryReadJSON(path.join(repo, d, 'package.json'));
    if (!lock || !pj) { status = 'WARN'; ev.push(`${d}: lockfile or package.json unreadable`); continue; }
    const root = (lock.packages && lock.packages['']) || {};
    for (const sec of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      const a = pj[sec] || {}, b = root[sec] || {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (a[k] === b[k]) continue;
        status = 'WARN';
        ev.push(`${d}: ${sec}.${k} package.json="${a[k] ?? '(absent)'}" lockfile="${b[k] ?? '(absent)'}"  -> npm ci would refuse; npm install would re-resolve`);
      }
    }
    // every root dependency must have a resolved entry in the lockfile
    for (const sec of ['dependencies', 'devDependencies']) {
      for (const k of Object.keys(pj[sec] || {})) {
        if (!lock.packages['node_modules/' + k]) { status = 'WARN'; ev.push(`${d}: ${k} is declared in package.json but has no node_modules/${k} entry in the lockfile`); }
      }
    }
    if (lock.name && pj.name && lock.name !== pj.name) ev.push(`${d}: lockfile name "${lock.name}" differs from package.json name "${pj.name}"`);
    if (!ev.some((e) => e.startsWith(d))) ev.push(`${d}: in sync (${Object.keys(pj.dependencies || {}).length} deps, ${Object.keys(pj.devDependencies || {}).length} devDeps)`);
  }
  if (!lockFiles.length) { status = 'WARN'; ev.push('no package-lock.json found; nothing pins the install'); }
  C.emit({ id: '6', cls: 'critical', title: 'package.json matches its lockfile', status, summary: status === 'PASS' ? 'root specs identical in package.json and package-lock.json' : 'mismatch: the lockfile does not describe this package.json', evidence: ev });
}

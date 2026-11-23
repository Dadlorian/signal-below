'use strict';
// Static scan of an installed node_modules tree. Reads files only; never requires or runs them.
// Usage: node nm-scan.js --dir <node_modules> [--allowlist file] [--label installed] [--id-prefix 14]
// Emits: lifecycle scripts, bin shadowing, IOC hits (FAIL / WARN / allowlisted), native binaries.
const fs = require('fs');
const path = require('path');
const C = require('./common');
const { RULES, SCRIPT_EXTS, LIFECYCLE, SYSTEM_BINS } = require('./iocs');

const nmDir = path.resolve(C.arg('--dir'));
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const label = C.arg('--label', 'installed');
const P = C.arg('--id-prefix', '14');
const MAX_FILE = 3 * 1024 * 1024;
const SCAN_EXTS = new Set([...SCRIPT_EXTS, '.json', '.yml', '.yaml', '']);

if (!fs.existsSync(nmDir)) {
  C.emit({ id: P, cls: 'critical', title: `Installed packages static scan (${label})`, status: 'INFO', summary: `no node_modules at ${nmDir}`, evidence: [] });
  process.exit(0);
}

// Find every package directory (dir with package.json) under node_modules, including nested and scoped.
function findPackages(root) {
  const out = [];
  const visit = (dir, depth) => {
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory() || e.isSymbolicLink()) continue;
      if (e.name === '.bin' || e.name === '.cache' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.name.startsWith('@')) { visit(p, depth); continue; }
      if (fs.existsSync(path.join(p, 'package.json'))) {
        out.push(p);
        const nested = path.join(p, 'node_modules');
        if (fs.existsSync(nested) && depth < 12) visit(nested, depth + 1);
      }
    }
  };
  visit(root, 0);
  return out;
}

const pkgDirs = findPackages(nmDir);
const INSTALL_HOOKS = new Set(['preinstall', 'install', 'postinstall', 'dependencies']);
const lifecycle = [], lifecycleAllowed = [], lifecycleInfo = [], binShadow = [], failHits = [], warnHits = [], allowedHits = [], natives = [], execFiles = [], symlinks = [], shaiFiles = [];
let filesScanned = 0, bytesScanned = 0;
const perRuleCount = {};

for (const pdir of pkgDirs) {
  const pj = C.tryReadJSON(path.join(pdir, 'package.json'));
  const rel = path.relative(nmDir, pdir);
  const name = (pj && pj.name) || rel.replace(/^.*node_modules\//, '');
  const version = (pj && pj.version) || '?';
  const tag = `${name}@${version}`;

  // lifecycle scripts. For a dependency installed from the registry npm runs ONLY preinstall/install/postinstall.
  // prepare/prepack/prepublish* run when the package is packed/published from source (or installed from git), so they are listed as info.
  if (pj && pj.scripts) {
    for (const k of LIFECYCLE) {
      if (!pj.scripts[k]) continue;
      const line = `${tag} ${k}: ${C.trunc(pj.scripts[k], 140)}`;
      const looksBad = RULES.filter((r) => r.level === 'FAIL').some((r) => r.re.test(pj.scripts[k]));
      if (looksBad) { failHits.push(`${tag} package.json scripts.${k}: ${C.trunc(pj.scripts[k], 140)}  [lifecycle script contains an IOC]`); continue; }
      if (!INSTALL_HOOKS.has(k)) { lifecycleInfo.push(line + '  (not run on install from the registry)'); continue; }
      const a = C.allowed(allowlist, 'install-script', name);
      if (a) lifecycleAllowed.push(line + `  (allowlisted: ${a.reason})`);
      else lifecycle.push(line);
    }
  }
  // bin shadowing: a package declaring a bin named like a system command, under a different package name
  if (pj && pj.bin) {
    const short = name.replace(/^@.*\//, '');
    const bins = typeof pj.bin === 'string' ? { [short]: pj.bin } : pj.bin;
    for (const [b, target] of Object.entries(bins)) {
      if (b === short || b === name) continue;
      if (SYSTEM_BINS.has(b) && !C.allowed(allowlist, 'bin', `${name}:${b}`)) binShadow.push(`${tag} declares bin "${b}" -> ${target} (shadows a system/toolchain command when node_modules/.bin is on PATH)`);
    }
  }
  // files
  const files = C.walk(pdir, { skipDirs: new Set(['node_modules', '.git']) });
  for (const f of files) {
    const frel = path.relative(nmDir, f.path);
    if (f.isSymlink) { symlinks.push(frel); continue; }
    const base = path.basename(f.path);
    const ext = path.extname(base).toLowerCase();
    if (/^(setup_bun\.js|bun_environment\.js|processor\.sh|shai-hulud.*|truffleSecrets\.json|actionsSecrets\.json|cloud\.json|environment\.json|contents\.json)$/i.test(base)) shaiFiles.push(`${frel} (${f.size} bytes)`);
    if (base === 'bundle.js' && path.dirname(f.path) === pdir && f.size > 500 * 1024) shaiFiles.push(`${frel} (${(f.size / 1024).toFixed(0)} KB root bundle.js; large root bundles were the Shai-Hulud carrier, check its content)`);
    if (ext === '.node' || ext === '.wasm' || ext === '.so' || ext === '.dll' || ext === '.dylib' || ext === '.exe') { natives.push(`${frel} (${(f.size / 1024).toFixed(0)} KB)`); continue; }
    if ((f.mode & 0o111) && !['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.sh'].includes(ext)) {
      // executable without a script extension: check for ELF / PE / Mach-O magic
      try { const fd = fs.openSync(f.path, 'r'); const b = Buffer.alloc(4); fs.readSync(fd, b, 0, 4, 0); fs.closeSync(fd);
        if (b.readUInt32BE(0) === 0x7f454c46 || (b[0] === 0x4d && b[1] === 0x5a) || [0xfeedface, 0xfeedfacf, 0xcafebabe, 0xcffaedfe, 0xcefaedfe].includes(b.readUInt32BE(0))) {
          const a = C.allowed(allowlist, 'pkg-ioc', name);
          if (a) natives.push(`${frel} (native executable, ${(f.size / 1024).toFixed(0)} KB; allowlisted: ${a.reason})`);
          else execFiles.push(`${frel} (native executable, ${(f.size / 1024).toFixed(0)} KB)`);
        } } catch { /* ignore */ }
    }
    if (!SCAN_EXTS.has(ext) || /\.d\.ts$|\.map$|\.min\.(js|mjs)$/.test(base)) continue;
    if (f.size > MAX_FILE) continue;
    const text = C.readTextBounded(f.path, MAX_FILE);
    if (text === null) continue;
    filesScanned++; bytesScanned += f.size;
    const lines = text.split('\n');
    for (const rule of RULES) {
      if (rule.where === 'code') continue;
      if (rule.scriptOnly && !SCRIPT_EXTS.has(ext)) continue;
      if (rule.exts && !rule.exts.includes(ext)) continue;
      const level = rule.pkgLevel || rule.level;
      if (level === 'INFO') continue;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 5000) continue; // skip minified mega-lines (bundles trip pattern rules constantly)
        const win = (s) => { const out = []; for (let j = s; j < s + (rule.window || 1) && j < lines.length; j++) { if (lines[j].length > 5000) break; out.push(lines[j]); } return out.join(' '); };
        const subject = win(i);
        if (!rule.re.test(subject)) continue;
        if (rule.window && i > 0 && rule.re.test(win(i - 1))) continue; // already reported from the previous window
        perRuleCount[rule.id] = (perRuleCount[rule.id] || 0) + 1;
        const hit = `${frel}:${i + 1} [${rule.id}] ${C.trunc(subject, 150)}`;
        const a = C.allowed(allowlist, 'pkg-ioc', `${name}:${rule.id}`) || (level === 'WARN' ? C.allowed(allowlist, 'pkg-ioc', name) : null);
        if (a) allowedHits.push(`${hit}  (allowlisted: ${a.reason})`);
        else if (level === 'FAIL') failHits.push(hit);
        else warnHits.push(hit);
        if (perRuleCount[rule.id] > 400) break;
      }
    }
  }
}

C.meta('nmscan.' + label, { packages: pkgDirs.length, filesScanned, bytesScanned, failHits: failHits.length, warnHits: warnHits.length, allowedHits: allowedHits.length, natives: natives.length });

const T = `Installed packages (${label})`;
C.emit({ id: P + 'a', cls: 'critical', title: `${T}: lifecycle scripts`, status: lifecycle.length ? 'FAIL' : 'PASS',
  summary: lifecycle.length ? `${lifecycle.length} package(s) declare install-time scripts that are not allowlisted` : `${pkgDirs.length} packages; ${lifecycleAllowed.length} allowlisted install script(s); ${lifecycleInfo.length} publish-time-only scripts (not run on install)`,
  evidence: [...lifecycle, ...lifecycleAllowed.map((s) => 'allowlisted: ' + s), ...lifecycleInfo.map((s) => 'info ' + s)] });
C.emit({ id: P + 'b', cls: 'critical', title: `${T}: bin names shadowing system commands`, status: binShadow.length ? 'WARN' : 'PASS',
  summary: binShadow.length ? `${binShadow.length} suspicious bin name(s)` : 'no package declares a bin named like a system command', evidence: binShadow });
C.emit({ id: P + 'c', cls: 'critical', title: `${T}: malware indicators (FAIL-level)`, status: failHits.length || shaiFiles.length ? 'FAIL' : 'PASS',
  summary: failHits.length || shaiFiles.length ? `${failHits.length} indicator line(s) + ${shaiFiles.length} suspicious file name(s)` : `no known-bad indicators in ${filesScanned} files (${(bytesScanned / 1048576).toFixed(1)} MB)`,
  evidence: [...shaiFiles.map((s) => 'FILE ' + s), ...failHits] });
C.emit({ id: P + 'd', cls: 'critical', title: `${T}: suspicious capabilities (needs a look)`, status: warnHits.length ? 'WARN' : 'PASS',
  summary: warnHits.length ? `${warnHits.length} hit(s) in packages not on the allowlist (child_process, home-dir reads, obfuscation, eval)` : 'no non-allowlisted package spawns processes, reads the home directory or uses obfuscation',
  evidence: warnHits });
C.emit({ id: P + 'e', cls: 'hygiene', title: `${T}: allowlisted hits (accepted, listed for transparency)`, status: 'INFO',
  summary: `${allowedHits.length} hit(s) in allowlisted build-tool packages`, evidence: allowedHits });
C.emit({ id: P + 'f', cls: 'hygiene', title: `${T}: native binaries and executables`, status: execFiles.length ? 'WARN' : 'INFO',
  summary: `${natives.length} native module/wasm file(s), ${execFiles.length} bare native executable(s), ${symlinks.length} symlink(s)`,
  evidence: [...execFiles.map((s) => 'EXEC ' + s), ...natives, ...symlinks.slice(0, 20).map((s) => 'symlink ' + s)] });

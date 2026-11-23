'use strict';
// Repo file checks: 1 sensitive files, 2 hard-coded secrets (+ personal data), 21 binaries/executables.
// Usage: node files-scan.js --repo root --allowlist f [--ignored-list f]   (file list on stdin)
const fs = require('fs');
const path = require('path');
const C = require('./common');

const repo = path.resolve(C.arg('--repo', process.cwd()));
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const files = fs.readFileSync(0, 'utf8').split(/\n|\0/).map((s) => s.trim()).filter(Boolean);
const ignoredList = C.arg('--ignored-list', '');
const ignored = ignoredList && fs.existsSync(ignoredList) ? fs.readFileSync(ignoredList, 'utf8').split('\n').filter(Boolean) : [];

const SENSITIVE_RE = /(^|\/)(\.env(\.[^/]*)?|[^/]*\.(pem|key|p12|pfx|jks|keystore|ppk|asc|gpg)|id_(rsa|dsa|ecdsa|ed25519)[^/]*|\.netrc|\.htpasswd|\.pgpass|credentials(\.json)?|service[-_]?account[^/]*\.json|secrets?\.(json|ya?ml|toml)|\.npmrc|\.yarnrc(\.yml)?|\.pypirc|\.docker\/config\.json|\.aws\/credentials|[^/]*\.sqlite3?|[^/]*\.db|wallet\.dat|\.history|\.bash_history|\.zsh_history)$/i;
const SECRET_RULES = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['AWS secret key assignment', /aws(.{0,20})?(secret|private)[^\n]{0,20}['"][A-Za-z0-9/+=]{40}['"]/i],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['npm token', /\bnpm_[A-Za-z0-9]{36}\b/],
  ['OpenAI / Anthropic key', /\bsk-(ant-)?[A-Za-z0-9_-]{20,}\b/],
  ['Slack token/webhook', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b|hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Stripe live key', /\b(sk|rk)_live_[0-9a-zA-Z]{20,}\b/],
  ['Discord webhook/token', /discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+|\b[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}\b/],
  ['Private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['Database URL with password', /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis|amqp):\/\/[^:\s/]+:[^@\s/]+@/i],
  ['Basic auth in URL', /https?:\/\/[^:\s/]+:[^@\s/]{4,}@[^\s/]+/],
  ['Generic secret assignment', /\b(api[_-]?key|apikey|secret|password|passwd|pwd|token|auth[_-]?token|access[_-]?token|private[_-]?key|client[_-]?secret)\b['"]?\s*[:=]\s*['"][^'"\s]{8,}['"]/i],
  ['Hex/base64 high-entropy assignment', /\b(key|secret|token|salt|seed)\b['"]?\s*[:=]\s*['"]([A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{40,}={0,2})['"]/i],
];
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BINARY_EXT = /\.(exe|dll|so|dylib|node|wasm|bin|msi|dmg|pkg|deb|rpm|apk|jar|class|pyc|o|a|lib)$/i;
const SCRIPT_EXT = /\.(sh|bash|zsh|bat|cmd|ps1|psm1|vbs|py|rb|pl)$/i;
const SKIP_TEXT = /\.(zip|png|jpe?g|gif|webp|ico|mp3|wav|ogg|woff2?|ttf|otf|eot|pdf|mp4|webm)$|package-lock\.json$/i;
const ignoreFalsePositives = [/example|placeholder|your[-_]?api[-_]?key|xxxx|changeme|<[^>]+>|\$\{[^}]+\}|process\.env/i];

// ---- 1. sensitive files ------------------------------------------------------------------------------------
{
  const bad = files.filter((f) => SENSITIVE_RE.test(f) && !C.allowed(allowlist, 'file', f));
  const npmrcOnly = bad.filter((f) => /(^|\/)\.npmrc$/.test(f));
  const real = bad.filter((f) => !/(^|\/)\.npmrc$/.test(f));
  const onDisk = ignored.filter((f) => SENSITIVE_RE.test(f) && !/node_modules\//.test(f) && !C.allowed(allowlist, 'file', f));
  const ev = [...real.map((f) => 'FAIL ' + f), ...npmrcOnly.map((f) => 'info ' + f + ' (npm config, content checked in [17])'), ...onDisk.map((f) => 'WARN ' + f + ' (git-ignored but present on disk; would travel inside a zip)')];
  const status = real.length ? 'FAIL' : onDisk.length ? 'WARN' : 'PASS';
  C.emit({ id: '1', cls: 'critical', title: 'Sensitive files (.env, keys, credentials, databases)', status,
    summary: status === 'PASS' ? `none among ${files.length} files` : `${real.length} sensitive file(s) in the tree, ${onDisk.length} ignored-but-present`, evidence: ev });
}

// ---- 2. hard-coded secrets + personal data ------------------------------------------------------------------
{
  const hits = [], emails = new Map();
  let scanned = 0;
  for (const f of files) {
    if (SKIP_TEXT.test(f)) continue;
    if (C.allowed(allowlist, 'secret', f)) continue; // e.g. the self-test fixture generator
    const abs = path.join(repo, f);
    const txt = C.readTextBounded(abs, 2 * 1024 * 1024); if (txt === null) continue;
    scanned++;
    const lines = txt.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (L.length > 4000) continue;
      for (const [why, re] of SECRET_RULES) {
        if (!re.test(L)) continue;
        if (why === 'Generic secret assignment' && ignoreFalsePositives.some((r) => r.test(L))) continue;
        if (why === 'Generic secret assignment' && /\.(md|html?|txt)$/i.test(f) && !/['"][A-Za-z0-9+/_-]{16,}['"]/.test(L)) continue; // prose
        hits.push(`${f}:${i + 1} (${why}) ${C.trunc(L.replace(/(['"])([^'"]{4})[^'"]*([^'"]{2})(['"])/g, '$1$2…$3$4'), 120)}`);
        break;
      }
      let m; EMAIL_RE.lastIndex = 0;
      while ((m = EMAIL_RE.exec(L))) { const e = m[0].toLowerCase(); if (/example\.com|^git@|^noreply@|@types|@radix|@tailwind|@vitejs|@hookform|@workspace|@replit|\.png$|\.svg$|\.js$|\.ts$/.test(e)) continue; if (!emails.has(e)) emails.set(e, `${f}:${i + 1}`); }
    }
  }
  const status = hits.length ? 'FAIL' : 'PASS';
  const ev = [...hits];
  if (emails.size) ev.push(...[...emails].slice(0, 30).map(([e, w]) => `info email address "${e}" at ${w} (personal data; fine if intended)`));
  C.emit({ id: '2', cls: 'critical', title: 'Hard-coded secrets and personal data', status,
    summary: status === 'PASS' ? `no secret-looking strings in ${scanned} text files; ${emails.size} e-mail address(es) listed for review` : `${hits.length} secret-looking line(s)`, evidence: ev });
}

// ---- 21. binaries, executables, large files ----------------------------------------------------------------
{
  const warn = [], info = [];
  for (const f of files) {
    if (C.allowed(allowlist, 'file', f)) continue;
    const abs = path.join(repo, f);
    let st; try { st = fs.lstatSync(abs); } catch { continue; }
    if (st.isSymbolicLink()) { let t = ''; try { t = fs.readlinkSync(abs); } catch { /* */ } warn.push(`${f}: symlink -> ${t}`); continue; }
    if (!st.isFile()) continue;
    const exec = !!(st.mode & 0o111);
    if (BINARY_EXT.test(f)) warn.push(`${f}: binary artefact by extension (${(st.size / 1024).toFixed(0)} KB)`);
    if (SCRIPT_EXT.test(f)) info.push(`${f}: script file${exec ? ', executable' : ''} (${st.size} bytes)`);
    else if (exec) info.push(`${f}: executable bit set (${st.size} bytes)`);
    if (st.size >= 4) {
      const fd = fs.openSync(abs, 'r'); const b = Buffer.alloc(4); fs.readSync(fd, b, 0, 4, 0); fs.closeSync(fd);
      const u = b.readUInt32BE(0);
      if (u === 0x7f454c46) warn.push(`${f}: ELF native executable (${(st.size / 1024).toFixed(0)} KB)`);
      else if (b[0] === 0x4d && b[1] === 0x5a) warn.push(`${f}: Windows PE executable (${(st.size / 1024).toFixed(0)} KB)`);
      else if ([0xfeedface, 0xfeedfacf, 0xcafebabe, 0xcffaedfe, 0xcefaedfe].includes(u) && !/\.class$/.test(f)) warn.push(`${f}: Mach-O executable (${(st.size / 1024).toFixed(0)} KB)`);
      else if (u === 0x504b0304 && !/\.zip$/i.test(f)) warn.push(`${f}: zip container with a non-zip extension`);
    }
    if (st.size > 1024 * 1024 && !/\.zip$/i.test(f)) info.push(`${f}: large file ${(st.size / 1048576).toFixed(1)} MB`);
  }
  const status = warn.length ? 'WARN' : 'PASS';
  C.emit({ id: '21', cls: 'critical', title: 'Binaries, executables and symlinks in the tree', status,
    summary: status === 'PASS' ? `no native binaries or symlinks; ${info.length} script/executable/large file(s) listed` : `${warn.length} binary/symlink item(s) need a look`,
    evidence: [...warn.map((s) => 'WARN ' + s), ...info.map((s) => 'info ' + s)] });
}
C.meta('files', { total: files.length, text: files.filter((f) => !SKIP_TEXT.test(f)).length });

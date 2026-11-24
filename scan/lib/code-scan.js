'use strict';
// Repo source code scan with triage. Reads a NUL/newline separated file list on stdin (repo-relative paths),
// or walks --root <dir>. Usage: node code-scan.js --repo <root> [--allowlist f] [--fail-only] [--id-prefix 7] [--label repo]
//   [--tunnel-host signal.gamelab.link] [--vite-config path]
// Emits: 7a FAIL hits, 7b WARN hits, 7c INFO inventory, 7d allowlisted hits, 8 external hosts, 16 vite exposure/tunnel host.
const fs = require('fs');
const path = require('path');
const C = require('./common');
const I = require('./iocs');

const repo = path.resolve(C.arg('--repo', process.cwd()));
const root = C.arg('--root', null);
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const failOnly = C.flag('--fail-only');
const warnToo = C.flag('--warn-too'); // with --fail-only: also report the WARN-level rules (eval, Function, child_process...) so a zip is read before it is overlaid
const P = C.arg('--id-prefix', '7');
const label = C.arg('--label', 'repo');
const tunnelHost = C.arg('--tunnel-host', '');
const viteConfigs = (C.arg('--vite-config', '') || '').split(',').filter(Boolean);
const MAX_FILE = 2 * 1024 * 1024;

let files;
if (root) files = C.walk(path.resolve(root), { skipDirs: new Set(['.git', 'node_modules']) }).filter((f) => !f.isSymlink).map((f) => f.rel);
else files = fs.readFileSync(0, 'utf8').split(/\n|\0/).map((s) => s.trim()).filter(Boolean);
const base = root ? path.resolve(root) : repo;

const failHits = [], warnHits = [], infoHits = [], allowedHits = [], hostsSeen = new Map();
const warnHygiene = [], viteHits = [];
const ruleCount = {};
let scanned = 0;

function pushHit(level, hygiene, rel, ln, ruleId, text, desc) {
  const hit = `${rel}:${ln} [${ruleId}] ${C.trunc(text, 150)}`;
  ruleCount[ruleId] = (ruleCount[ruleId] || 0) + 1;
  // FAIL-level hits can only be accepted by an explicit "path:RULE" (or "path:*") entry, never by a bare path glob.
  const a = C.allowed(allowlist, 'code', `${rel}:${ruleId}`) || (level !== 'FAIL' ? C.allowed(allowlist, 'code', rel) : null);
  if (a) { allowedHits.push(`${hit}  (allowlisted: ${a.reason})`); return; }
  if (level === 'FAIL') failHits.push(hit);
  else if (level === 'WARN') (hygiene ? warnHygiene : warnHits).push(hit);
  else infoHits.push(hit);
}

for (const rel of files) {
  const abs = path.join(base, rel);
  let st; try { st = fs.statSync(abs); } catch { continue; }
  if (!st.isFile() || st.size > MAX_FILE) continue;
  const ext = path.extname(rel).toLowerCase();
  if (!I.CODE_EXTS.has(ext) && !['.md', '.txt', '.mdx', '.env', '.conf', '.ini', '.xml', '.svg', ''].includes(ext)) continue;
  if (/package-lock\.json$/.test(rel)) continue;
  const text = C.readTextBounded(abs, MAX_FILE);
  if (text === null) continue;
  scanned++;
  const lines = text.split('\n');
  const isScript = I.SCRIPT_EXTS.has(ext);

  for (const rule of I.RULES) {
    if (rule.where === 'pkg') continue;
    const level = rule.codeLevel || rule.level;
    if (failOnly && !warnToo && level !== 'FAIL') continue;
    if (rule.scriptOnly && !isScript) continue;
    if (rule.exts && !rule.exts.includes(ext)) continue;
    if (rule.files && !rule.files.test(rel)) continue;
    for (let i = 0; i < lines.length; i++) {
      const win = (s) => { const out = []; for (let j = s; j < s + (rule.window || 1) && j < lines.length; j++) { if (lines[j].length > 5000) break; out.push(lines[j]); } return out.join(' '); };
      const subject = win(i);
      if (!rule.re.test(subject)) continue;
      if (rule.window && i > 0 && rule.re.test(win(i - 1))) continue;
      pushHit(level, !!rule.hygiene, rel, i + 1, rule.id, subject, rule.desc);
      if (rule.id === 'VITE_EXPOSED') viteHits.push(`${rel}:${i + 1} ${C.trunc(lines[i], 120)}`);
    }
  }
  if (!failOnly && isScript) {
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      let m;
      if ((m = L.match(I.INNER_HTML_RE)) || (m = L.match(I.OUTER_HTML_RE)) || (m = L.match(I.INSERT_ADJ_RE))) {
        // dynamic HTML sinks are an XSS (bug) class, not a malware indicator -> hygiene bucket
        const constant = I.isConstantRhs(m[1]);
        pushHit(constant ? 'INFO' : 'WARN', true, rel, i + 1, constant ? 'INNERHTML_CONST' : 'INNERHTML_DYNAMIC', L);
      }
      if (I.DANGEROUS_RE.test(L)) {
        const window = lines.slice(i, i + 4).join(' ');
        const h = window.match(/__html\s*:\s*(.+)/);
        const constant = h ? /^\s*(['"])(?:(?!\1).)*\1\s*[}\],]?/.test(h[1]) || /^\s*`[^`$]*`/.test(h[1]) : false;
        pushHit(constant ? 'INFO' : 'WARN', true, rel, i + 1, constant ? 'DANGEROUS_HTML_CONST' : 'DANGEROUS_HTML_DYNAMIC', window);
      }
    }
    // external hosts inventory (code/html/css only)
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html', '.htm', '.css', '.vue', '.svelte'].includes(ext)) {
      const re = /(https?|wss?):\/\/([A-Za-z0-9._-]+)(:\d+)?/g;
      let mm;
      while ((mm = re.exec(text))) {
        const host = mm[2].toLowerCase();
        const ln = text.slice(0, mm.index).split('\n').length;
        if (!hostsSeen.has(host)) hostsSeen.set(host, []);
        const arr = hostsSeen.get(host);
        if (arr.length < 5) arr.push(`${rel}:${ln}`);
      }
    }
  }
}
// CSS also counts for hosts; include css files that were skipped above because CODE_EXTS lacks .css
if (!root && !failOnly) {
  for (const rel of files) {
    if (path.extname(rel).toLowerCase() !== '.css') continue;
    const text = C.readTextBounded(path.join(base, rel), MAX_FILE); if (!text) continue;
    const re = /(https?|wss?):\/\/([A-Za-z0-9._-]+)/g; let mm;
    while ((mm = re.exec(text))) { const host = mm[2].toLowerCase(); if (!hostsSeen.has(host)) hostsSeen.set(host, []); const arr = hostsSeen.get(host); if (arr.length < 5) arr.push(`${rel}:${text.slice(0, mm.index).split('\n').length}`); }
  }
}

C.meta('codescan.' + label, { filesScanned: scanned, failHits: failHits.length, warnHits: warnHits.length, hygieneWarns: warnHygiene.length, infoHits: infoHits.length, allowedHits: allowedHits.length, ruleCount });

const T = failOnly ? `Code in ${label}` : 'Code patterns';
C.emit({ id: P + 'a', cls: 'critical', title: `${T}: malicious indicators (FAIL-level)`, status: failHits.length ? 'FAIL' : 'PASS',
  summary: failHits.length ? `${failHits.length} line(s) match known-bad patterns` : `no known-bad patterns in ${scanned} files`, evidence: failHits });
if (failOnly && warnToo) {
  C.emit({ id: P + 'b', cls: 'critical', title: `${T}: needs a human look (WARN-level)`, status: warnHits.length ? 'WARN' : 'PASS',
    summary: warnHits.length ? `${warnHits.length} hit(s): eval/Function/child_process/cookies/secret storage/obfuscation in the zip` : 'no eval, Function constructor, child_process, cookie access or secret storage in the zip outside the allowlist',
    evidence: warnHits });
}
if (!failOnly) {
  C.emit({ id: P + 'b', cls: 'critical', title: `${T}: needs a human look (WARN-level)`, status: warnHits.length ? 'WARN' : 'PASS',
    summary: warnHits.length ? `${warnHits.length} hit(s): eval/Function/child_process/dynamic innerHTML/cookies/secret storage/obfuscation` : 'no eval, Function constructor, child_process, dynamic innerHTML, cookie access or secret-looking storage outside the allowlist',
    evidence: warnHits });
  C.emit({ id: P + 'c', cls: 'hygiene', title: `${T}: network and DOM inventory (INFO)`, status: 'INFO',
    summary: `${infoHits.length} line(s): ${Object.entries(ruleCount).filter(([k]) => ['NET_CALL', 'WINDOW_OPEN', 'INNERHTML_CONST', 'DANGEROUS_HTML_CONST', 'TARGET_BLANK', 'EXTERNAL_STYLE_NO_SRI'].includes(k)).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}`,
    evidence: infoHits });
  C.emit({ id: P + 'd', cls: 'hygiene', title: `${T}: allowlisted hits (accepted, listed for transparency)`, status: 'INFO',
    summary: `${allowedHits.length} hit(s) in allowlisted paths (vendored shadcn/ui components, scanner sources)`, evidence: allowedHits });

  // 8. external hosts
  const unexpected = [], expected = [];
  for (const [host, where] of [...hostsSeen.entries()].sort()) {
    const a = C.allowed(allowlist, 'host', host);
    if (a) expected.push(`${host} (${a.reason}) e.g. ${where[0]}`);
    else unexpected.push(`${host}  at ${where.join(', ')}`);
  }
  C.emit({ id: '8', cls: 'critical', title: 'External hosts referenced by code/markup/css', status: unexpected.length ? 'WARN' : 'PASS',
    summary: unexpected.length ? `${unexpected.length} host(s) not on the allowlist` : `only allowlisted hosts (${expected.length})`,
    evidence: [...unexpected.map((s) => 'NEW ' + s), ...expected.map((s) => 'ok  ' + s)] });

  // 7e. DOM injection sinks with non-constant input (XSS class; a bug risk for players, not a supply-chain indicator)
  const sinks = warnHygiene.filter((h) => /\[(INNERHTML_DYNAMIC|DANGEROUS_HTML_DYNAMIC)\]/.test(h));
  const exposure = warnHygiene.filter((h) => !/\[(INNERHTML_DYNAMIC|DANGEROUS_HTML_DYNAMIC)\]/.test(h));
  C.emit({ id: P + 'e', cls: 'hygiene', title: `${T}: HTML injection sinks with variable input`, status: sinks.length ? 'WARN' : 'PASS',
    summary: sinks.length ? `${sinks.length} innerHTML/dangerouslySetInnerHTML assignment(s) built from variables (fine if the variables are the page's own constants; a bug if they ever hold player input)` : 'no innerHTML/dangerouslySetInnerHTML with variable input outside the allowlist',
    evidence: sinks });

  // 16. vite server settings (structural), dev-server exposure, CORS, tunnel host presence.
  // Rules and their doc sources: scan/README.md, "Appendix: rule sources" (vite docs/config/server-options.md, GHSA-vg6x-rcgg-rjx6).
  const viteFail = [], viteWarn = [], viteInfo = [], viteAllowed = [];
  const allViteConfigs = files.filter((f) => /(^|\/)vite\.config\.[cm]?[jt]s$/.test(f));
  const mainConfigs = new Set(viteConfigs);
  const stripComments = (t) => t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // brace-balanced "name: { ... }" block body, or null
  const getBlock = (src, name) => {
    const start = src.search(new RegExp(`(^|[\\s,{])${name}\\s*:\\s*\\{`));
    if (start === -1) return null;
    let i = src.indexOf('{', start), depth = 0;
    for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(src.indexOf('{', start) + 1, i); } }
    return src.slice(src.indexOf('{', start) + 1);
  };
  const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;
  const viteHit = (level, rel, ln, ruleId, text) => {
    const hit = `${rel}:${ln} [${ruleId}] ${C.trunc(text, 150)}`;
    const a = C.allowed(allowlist, 'code', `${rel}:${ruleId}`);
    if (a) { viteAllowed.push(`${hit}  (allowlisted: ${a.reason})`); return; }
    (level === 'FAIL' ? viteFail : level === 'WARN' ? viteWarn : viteInfo).push(hit);
  };
  for (const vc of allViteConfigs) {
    const abs = path.join(base, vc);
    const txt = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    if (!txt) continue;
    const src = stripComments(txt);
    const pkg = C.tryReadJSON(path.join(base, path.dirname(vc), 'package.json'));
    const usesHostFlag = !!(pkg && pkg.scripts && Object.values(pkg.scripts).some((s) => /\bvite\b[^\n"']*\s--host\b/.test(String(s))));
    const tunnelPresent = {};
    for (const blockName of ['server', 'preview']) {
      const body = getBlock(src, blockName);
      const label = `${blockName}.`;
      if (body === null) {
        if (usesHostFlag) viteHit('WARN', vc, 1, 'VITE_ALLOWED_HOSTS_MISSING', `${blockName} block absent while package.json runs vite --host: default allowedHosts (localhost + local IPs) will block any hostname such as a tunnel`);
        tunnelPresent[blockName] = false;
        continue;
      }
      const off = src.indexOf(body);
      const ah = body.match(/allowedHosts\s*:\s*(true|false|\[[^\]]*\]|[^,\n}]+)/);
      if (!ah) { if (usesHostFlag) viteHit('WARN', vc, lineOf(src, off), 'VITE_ALLOWED_HOSTS_MISSING', `${label}allowedHosts not set while vite --host is used (default: localhost + local IPs only)`); tunnelPresent[blockName] = false; }
      else if (/^true$/.test(ah[1].trim())) { viteHit('FAIL', vc, lineOf(src, off + ah.index), 'VITE_ALLOWED_HOSTS_TRUE', `${label}allowedHosts: true -> any Host header accepted; DNS-rebinding can read source code (GHSA-vg6x-rcgg-rjx6)`); tunnelPresent[blockName] = true; }
      else if (ah[1].trim().startsWith('[')) { tunnelPresent[blockName] = tunnelHost ? new RegExp(`['"\`]${tunnelHost.replace(/\./g, '\\.')}['"\`]`).test(ah[1]) : true; viteInfo.push(`${vc}:${lineOf(src, off + ah.index)} [VITE_ALLOWED_HOSTS_LIST] ${label}allowedHosts is an explicit list: ${C.trunc(ah[1], 100)}`); }
      else { viteHit('WARN', vc, lineOf(src, off + ah.index), 'VITE_ALLOWED_HOSTS_DYNAMIC', `${label}allowedHosts = ${C.trunc(ah[1], 80)} (computed value; check what it resolves to)`); tunnelPresent[blockName] = null; }
      const host = body.match(/(^|[\s,{])host\s*:\s*(['"]0\.0\.0\.0['"]|['"]::['"]|true)/);
      if (host) viteHit('WARN', vc, lineOf(src, off + host.index), 'VITE_HOST_ALL', `${label}host = ${host[2]} -> listens on every interface (LAN; internet if tunnelled)`);
      if (/(^|[\s,{])cors\s*:\s*true/.test(body)) viteHit('WARN', vc, lineOf(src, off), 'VITE_CORS_TRUE', `${label}cors: true -> any website may read dev-server responses`);
      const proxy = getBlock(body, 'proxy');
      if (proxy !== null) viteHit('INFO', vc, lineOf(src, off), 'VITE_PROXY', `${label}proxy forwards requests: ${C.trunc(proxy, 100)}`);
      if (blockName === 'server') {
        const fsb = getBlock(body, 'fs');
        if (fsb !== null) {
          const foff = src.indexOf(fsb);
          if (/strict\s*:\s*false/.test(fsb)) viteHit('FAIL', vc, lineOf(src, foff), 'VITE_FS_STRICT_FALSE', 'server.fs.strict: false -> files outside the workspace root can be served');
          const deny = fsb.match(/deny\s*:\s*\[([^\]]*)\]/);
          if (deny) {
            const defaults = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**'];
            const missing = defaults.filter((d) => !deny[1].includes(d));
            if (missing.length) viteHit('FAIL', vc, lineOf(src, foff + deny.index), 'VITE_FS_DENY_WEAKENED', `server.fs.deny overrides the defaults and drops ${missing.join(', ')} -> those files become servable`);
            else viteInfo.push(`${vc}:${lineOf(src, foff + deny.index)} [VITE_FS_DENY] server.fs.deny keeps the default entries`);
          }
          const allow = fsb.match(/allow\s*:\s*\[([^\]]*)\]/);
          if (allow && /['"`](\/|\.\.|\.\.\/|~|\/home|\/etc|\/root)[^'"`]*['"`]/.test(allow[1])) viteHit('WARN', vc, lineOf(src, foff + allow.index), 'VITE_FS_ALLOW_BROAD', `server.fs.allow includes a broad path: ${C.trunc(allow[1], 100)}`);
        }
      }
    }
    if (tunnelHost && mainConfigs.has(vc)) {
      const s = tunnelPresent.server, p = tunnelPresent.preview;
      if (s === true && p === true) viteInfo.push(`${vc} [TUNNEL_HOST] ${tunnelHost} accepted by server and preview (ok)`);
      else if (s === null || p === null) viteInfo.push(`${vc} [TUNNEL_HOST] ${tunnelHost}: cannot tell statically (computed allowedHosts)`);
      else viteInfo.unshift(`${vc} [TUNNEL_HOST_MISSING] REGRESSION: "${tunnelHost}" is ${s ? 'present' : 'MISSING'} in server.allowedHosts and ${p ? 'present' : 'MISSING'} in preview.allowedHosts -> the public site through the Cloudflare tunnel answers "Blocked request" until it is restored (not a security hole; the site is simply down)`);
    }
  }
  const tunnelRegression = viteInfo.some((e) => e.includes('[TUNNEL_HOST_MISSING]'));
  const ev = [...viteFail.map((s) => 'FAIL ' + s), ...viteWarn.map((s) => 'WARN ' + s), ...exposure.map((s) => 'WARN ' + s), ...viteInfo.map((s) => (s.includes('TUNNEL_HOST_MISSING') ? 'REGRESSION ' : 'info ') + s), ...viteAllowed.map((s) => 'accepted ' + s)];
  const status = viteFail.length ? 'FAIL' : (viteWarn.length || exposure.length) ? 'WARN' : tunnelRegression ? 'INFO' : 'PASS';
  C.meta('vite', { configs: allViteConfigs.length, fail: viteFail.length, warn: viteWarn.length + exposure.length, tunnelRegression });
  C.emit({ id: '16', cls: 'hygiene', title: 'Vite server settings, dev-server exposure, CORS and tunnel host', status,
    summary: status === 'PASS' ? `${allViteConfigs.length} vite config(s): no permissive server settings` : `${viteFail.length} unsafe vite setting(s), ${viteWarn.length + exposure.length} exposure setting(s) (--host / host 0.0.0.0 / open CORS)${tunnelRegression ? `; ${tunnelHost} MISSING from allowedHosts (site regression)` : ''}`, evidence: ev });
}

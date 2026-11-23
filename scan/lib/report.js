'use strict';
// Renders reports/security-report-<stamp>.md and reports/latest.json from the run's results.jsonl + meta.jsonl.
// Usage: node report.js --results f --meta f --out-md f --out-json f --allowlist f --repo root --stamp s [--mode text]
const fs = require('fs');
const path = require('path');
const C = require('./common');

const results = fs.readFileSync(C.arg('--results'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const metaLines = fs.existsSync(C.arg('--meta')) ? fs.readFileSync(C.arg('--meta'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const meta = {}; for (const m of metaLines) meta[m.key] = m.value;
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const outMd = C.arg('--out-md'), outJson = C.arg('--out-json');
const stamp = C.arg('--stamp', new Date().toISOString());
const repo = C.arg('--repo', process.cwd());
const optIdx = process.argv.indexOf('--options');
const options = (optIdx === -1 ? '' : (process.argv[optIdx + 1] || '')).split(',').filter(Boolean);
const MAX_EV = 200;

// ---- verdict -------------------------------------------------------------------------------------------
const fails = results.filter((r) => r.status === 'FAIL');
const critWarns = results.filter((r) => r.status === 'WARN' && r.cls === 'critical');
const hygWarns = results.filter((r) => r.status === 'WARN' && r.cls !== 'critical');
const skips = results.filter((r) => r.status === 'SKIP');
let verdict, rule;
if (fails.length) { verdict = 'HIGH'; rule = `at least one FAIL (${fails.map((r) => '[' + r.id + ']').join(' ')}). Rule: any FAIL means "do not install or launch until it is understood".`; }
else if (critWarns.length) { verdict = 'MEDIUM'; rule = `no FAIL, but ${critWarns.length} WARN in supply-chain/secrets/config checks (${critWarns.map((r) => '[' + r.id + ']').join(' ')}). Rule: a WARN in a critical-class check needs a human decision before installing.`; }
else { verdict = 'LOW'; rule = hygWarns.length ? `no FAIL and no critical-class WARN; ${hygWarns.length} hygiene WARN(s) listed below (${hygWarns.map((r) => '[' + r.id + ']').join(' ')}) do not change the verdict.` : 'no FAIL and no WARN.'; }
if (skips.length && verdict === 'LOW') rule += ` Note: ${skips.length} check(s) were skipped (${skips.map((r) => '[' + r.id + ']').join(' ')}), so this verdict covers less than a full run.`;

const counts = { PASS: 0, WARN: 0, FAIL: 0, INFO: 0, SKIP: 0 };
for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;

// ---- what was scanned -----------------------------------------------------------------------------------
const scanned = [];
if (meta.files) scanned.push(`${meta.files.total} files in the working tree (tracked + untracked, not ignored); ${meta.files.text} text files read for patterns`);
for (const [k, v] of Object.entries(meta)) {
  if (k.startsWith('lockfile.')) scanned.push(`${k.slice(9)}: lockfileVersion ${v.lockfileVersion}, ${v.entries} package entries`);
  if (k.startsWith('node_modules.')) scanned.push(`installed node_modules next to ${k.slice(13)}: ${v.installedEntries} packages (missing ${v.missing}, version-differs ${v.differ}, extra ${v.extra}, unknown-on-disk ${v.unknown})`);
  if (k.startsWith('nmscan.')) scanned.push(`node_modules static scan (${k.slice(7)}): ${v.packages} package dirs, ${v.filesScanned} files, ${(v.bytesScanned / 1048576).toFixed(1)} MB read`);
  if (k.startsWith('codescan.')) scanned.push(`code scan (${k.slice(9)}): ${v.filesScanned} files`);
  if (k === 'registry') scanned.push(`registry metadata: ${v.packages} name@version pairs (${v.fetched} fetched, ${v.cached} cached, ${v.errors} errors); provenance on ${v.withProvenance}`);
  if (k === 'archives') scanned.push(`archives: ${v.count} zip(s), ${v.entries} entries listed${v.extracted ? `, ${v.extracted} extracted to scratch for static inspection` : ''}`);
  if (k === 'git') scanned.push(`git history: ${v.commits} commits, ${v.patchBytes ? (v.patchBytes / 1048576).toFixed(1) + ' MB of patches scanned' : 'patch scan skipped'}`);
}

// ---- sections -------------------------------------------------------------------------------------------
const SECTIONS = [
  ['Files and secrets', ['1', '2', '21', '22', '23', '24', '25']],
  ['Dependencies (supply chain)', ['3', '4', '5', '6', '10', '11', '12', '13', '9', '15']],
  ['Installed packages (node_modules)', ['14a', '14b', '14c', '14d', '14e', '14f', '30a', '30b', '30c', '30d', '30e', '30f']],
  ['Code', ['7a', '7b', '7c', '7d', '8', '16', '26a']],
  ['Configuration and AI-agent surface', ['17', '18', '19', '20']],
];
const byId = new Map(results.map((r) => [r.id, r]));
const placed = new Set();
const icon = { PASS: 'PASS', WARN: 'WARN', FAIL: 'FAIL', INFO: 'info', SKIP: 'skip' };

let md = '';
md += `# Security scan report\n\n`;
md += `Generated ${stamp} for \`${repo}\`${options.length ? ` with options: ${options.join(' ')}` : ''}.\n\n`;
md += `## Verdict: ${verdict} RISK\n\n`;
md += `> ${rule}\n>\n> A LOW verdict means **no indicators found by these checks**, never "safe"; see "Residual risk" below. MEDIUM means a human must read the critical-class WARN items and decide; HIGH means stop.\n\n`;
md += `Checks: ${counts.PASS} pass, ${counts.WARN} warn (${critWarns.length} critical-class, ${hygWarns.length} hygiene), ${counts.FAIL} fail, ${counts.INFO} info, ${counts.SKIP} skipped.\n\n`;

md += `## What was scanned\n\n`;
for (const s of scanned) md += `- ${s}\n`;
if (!scanned.length) md += `- (no counters recorded)\n`;
md += '\n';

md += `## Results\n\n| ID | Check | Class | Status | Summary |\n|---|---|---|---|---|\n`;
for (const [sec, ids] of SECTIONS) {
  const rows = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!rows.length) continue;
  md += `| | **${sec}** | | | |\n`;
  for (const r of rows) { placed.add(r.id); md += `| ${r.id} | ${r.title} | ${r.cls} | **${icon[r.status] || r.status}** | ${r.summary.replace(/\|/g, '\\|')} |\n`; }
}
const rest = results.filter((r) => !placed.has(r.id));
if (rest.length) { md += `| | **Other** | | | |\n`; for (const r of rest) md += `| ${r.id} | ${r.title} | ${r.cls} | **${icon[r.status] || r.status}** | ${r.summary.replace(/\|/g, '\\|')} |\n`; }
md += '\n';

md += `## Evidence per check\n\n`;
const order = [...SECTIONS.flatMap(([, ids]) => ids), ...rest.map((r) => r.id)];
for (const id of order) {
  const r = byId.get(id); if (!r) continue;
  md += `### [${r.id}] ${r.title} — ${r.status}\n\n${r.summary}\n\n`;
  if (r.evidence.length) {
    md += '```\n';
    for (const e of r.evidence.slice(0, MAX_EV)) md += e.replace(/```/g, "'''") + '\n';
    if (r.evidence.length > MAX_EV) md += `... ${r.evidence.length - MAX_EV} more lines omitted (see latest.json)\n`;
    md += '```\n\n';
  }
}

md += `## What changed since the last commit\n\n`;
if (meta.gitStatus && meta.gitStatus.length) { md += 'Working-tree changes (`git status --porcelain`):\n\n```\n' + meta.gitStatus.join('\n') + '\n```\n\n'; }
else md += 'Working tree is clean relative to HEAD.\n\n';
const diffRec = byId.get('12');
if (diffRec) md += `Dependency changes: ${diffRec.summary}. Full list in [12] above.\n\n`;

md += `## Allowlist / accepted risk\n\n`;
md += `Entries live in \`scan/allowlist.txt\`. Each needs a reason and a date. "matched" is how many hits the entry absorbed in this run.\n\n| kind | pattern | reason | since | matched |\n|---|---|---|---|---|\n`;
for (const a of allowlist) md += `| ${a.kind} | \`${a.pattern}\` | ${a.reason.replace(/\|/g, '\\|')} | ${a.date} | ${a.used ? a.used : 'see check output'} |\n`;
md += `\nAllowlisted hits are still printed in checks 7d and 14e so nothing is silently hidden.\n\n`;

md += `## Residual risk (please read)\n\n`;
md += `This is a static scan. It reads files and registry metadata; it never runs the project or its packages. It can show the presence of known-bad indicators and the absence of them within its rules. It cannot prove absence of malware. In particular it does **not** rule out:\n\n`;
md += `- Malicious logic written in plain, unobfuscated JavaScript that does not touch the patterns above (e.g. a package that quietly posts game data to its own normal-looking domain).\n`;
md += `- A compromised but correctly signed package version that is older than the ${meta.registry ? meta.registry.minAgeDays : 14}-day release-age window, or a maintainer account takeover that kept the same account name.\n`;
md += `- Native binaries (.node/.wasm) in esbuild, rollup/rolldown, lightningcss, tailwind oxide: their behaviour is not inspected; only their presence and origin.\n`;
md += `- Vulnerabilities that npm audit does not know about yet (zero-days), or problems in the browser itself.\n`;
md += `- Anything that only happens at run time: the dev server (\`vite --host\`) listens on all network interfaces; a bug in the game or in vite could be reachable by anyone who can reach that port (at home: the LAN; through the Cloudflare tunnel: the internet).\n`;
md += `- Problems inside the Cloudflare tunnel, the host OS, docker, or node itself.\n\n`;
md += `What it does rule out, within its rules: non-registry or hash-less packages in the lockfile, install-time scripts outside the allowlist, lookalike package names from the built-in list, known exfiltration hosts, pipe-to-shell installers, decoded-eval loaders, credential-file reads, Shai-Hulud markers, hard-coded secrets of common formats, dangerous .npmrc settings, active git hooks, and prompt-injection phrases in text files.\n\n`;

md += `## Recommended next actions\n\n`;
if (verdict === 'HIGH') md += `1. **Do not install or launch.** Open the FAIL item(s) above and read the exact file:line. If it is a false alarm (e.g. the word appears in documentation), add a dated allowlist entry with the reason and re-run. If it is real, delete the update and ask for a fresh copy without it.\n`;
else if (verdict === 'MEDIUM') md += `1. Read each critical-class WARN above and decide. Typical safe outcome: the item is understood (e.g. an unpinned version that the lockfile pins) and you add a dated allowlist entry; or you ask for the update to be redone.\n`;
else md += `1. No blocking findings. Still read the hygiene WARN items once; they are notes, not alarms.\n`;
let step = 2;
const drift = byId.get('13');
if (drift && drift.status === 'WARN') md += `${step++}. **The existing node_modules is stale** ([13]: ${drift.summary}). Delete it; do not run \`npm run dev\` against it. Everything that was audited here is the lockfile, not that folder.\n`;
md += `${step++}. Install only inside the container: \`scan/contained-install.sh\` (uses \`npm ci --ignore-scripts\` in docker, then re-scans the result). Never \`npm install\` on the host.\n`;
const vite = byId.get('16');
if (vite && vite.evidence.some((e) => e.includes('TUNNEL_HOST_MISSING'))) md += `${step++}. **Site regression, not a security hole:** the tunnel hostname is missing from \`allowedHosts\` in the main \`vite.config.ts\` ([16]). The public site will answer "Blocked request" until \`server.allowedHosts\` and \`preview.allowedHosts\` list it again. Ask the author to restore it (it was in the last committed version).\n`;
if (vite && vite.status === 'FAIL') md += `${step++}. A vite config allows any host or weakens file serving ([16]). Do not start that dev server until it is fixed or allowlisted with a reason.\n`;
md += `${step++}. Prefer serving the production build (\`vite build\` then static files / \`vite preview\`) behind the tunnel over \`vite --host\` dev mode.\n`;
md += `${step++}. Keep this report; next time, compare "What changed" against it.\n`;

fs.mkdirSync(path.dirname(outMd), { recursive: true });
fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify({ generated: stamp, repo, options, verdict, rule, counts, criticalWarnIds: critWarns.map((r) => r.id), hygieneWarnIds: hygWarns.map((r) => r.id), failIds: fails.map((r) => r.id), scanned: meta, results, allowlist: allowlist.map(({ re, ...a }) => a) }, null, 2));

// terminal summary
console.log('');
console.log(`VERDICT: ${verdict} RISK  (${counts.FAIL} fail, ${counts.WARN} warn [${critWarns.length} critical, ${hygWarns.length} hygiene], ${counts.PASS} pass, ${counts.INFO} info, ${counts.SKIP} skipped)`);
console.log(`  ${rule}`);
if (fails.length) for (const r of fails) console.log(`  FAIL [${r.id}] ${r.title}: ${r.summary}`);
if (critWarns.length) for (const r of critWarns) console.log(`  WARN [${r.id}] ${r.title}: ${r.summary}`);
console.log(`Report: ${outMd}`);
console.log(`JSON:   ${outJson}`);
process.exit(fails.length ? 1 : 0);

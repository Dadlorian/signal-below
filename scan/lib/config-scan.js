'use strict';
// Configuration / CI / AI-agent surface. Usage: node config-scan.js --repo <root> [--allowlist f]
// Reads a file list (tracked + untracked) on stdin. Emits checks 17 (.npmrc), 18 (replit / hooks / CI), 19 (AI agent settings), 20 (prompt-injection text).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const C = require('./common');

const repo = path.resolve(C.arg('--repo', process.cwd()));
const allowlist = C.loadAllowlist(C.arg('--allowlist', ''));
const files = fs.readFileSync(0, 'utf8').split(/\n|\0/).map((s) => s.trim()).filter(Boolean);
const read = (rel) => { try { return fs.readFileSync(path.join(repo, rel), 'utf8'); } catch { return null; } };

// ---- 17. .npmrc files -------------------------------------------------------------------------------
{
  const KNOWN_NPM = new Set(['registry', 'save-exact', 'engine-strict', 'legacy-peer-deps', 'fund', 'audit', 'ignore-scripts', 'package-lock', 'loglevel', 'progress', 'prefer-offline', 'cache', 'strict-ssl', 'ca', 'cafile', 'proxy', 'https-proxy', 'noproxy', 'script-shell', 'unsafe-perm', 'node-options', 'prefix', 'global', 'shamefully-hoist', 'public-hoist-pattern', 'auto-install-peers', 'strict-peer-dependencies', 'node-linker', 'resolution-mode', 'dedupe-peer-dependents', 'link-workspace-packages', 'prefer-workspace-packages', 'enable-pre-post-scripts', 'side-effects-cache', 'always-auth', 'email', 'init-author-name', 'init-license', 'save-prefix', 'tag', 'update-notifier', 'color', 'omit', 'include', 'install-links', 'min-release-age', 'minimum-release-age']);
  const npmrcs = files.filter((f) => /(^|\/)\.npmrc$/.test(f));
  const fail = [], warn = [], info = [];
  for (const f of npmrcs) {
    const txt = read(f); if (txt === null) continue;
    txt.split('\n').forEach((line, i) => {
      const t = line.trim(); if (!t || t.startsWith('#') || t.startsWith(';')) return;
      const where = `${f}:${i + 1}`;
      const m = t.match(/^([^=]+?)\s*=\s*(.*)$/);
      // odd-but-harmless lines can be accepted with kind "npmrc" and pattern "<file>:<key>" (never the dangerous ones below)
      const acc = (key) => C.allowed(allowlist, 'npmrc', `${f}:${key}`);
      if (!m) { const a = acc(t); (a ? info : warn).push(`${where}: not a key=value line (npm reads it as a config key named "${C.trunc(t, 60)}"): free text in .npmrc${a ? '  (accepted: ' + a.reason + ')' : ''}`); return; }
      const key = m[1].trim(), val = m[2].trim();
      if (/_authToken|_auth$|_password|:_auth/i.test(key)) fail.push(`${where}: credential in repo config (${key})`);
      else if (key === 'registry' && !/^https:\/\/registry\.npmjs\.org\/?$/.test(val)) fail.push(`${where}: registry redirected to ${val}`);
      else if (/^@[^:]+:registry$/.test(key) && !/^https:\/\/registry\.npmjs\.org\/?$/.test(val)) fail.push(`${where}: scoped registry redirected (${key}=${val})`);
      else if (key === 'ignore-scripts' && /^(false|0|no)$/i.test(val)) warn.push(`${where}: ignore-scripts=false explicitly re-enables install scripts`);
      else if (['script-shell', 'unsafe-perm', 'node-options', 'onload-script', 'proxy', 'https-proxy', 'cafile', 'ca'].includes(key)) warn.push(`${where}: ${key}=${val} changes how npm executes or trusts network`);
      else if (key === 'strict-ssl' && /^(false|0)$/i.test(val)) fail.push(`${where}: strict-ssl=false disables TLS verification`);
      else if (!KNOWN_NPM.has(key)) { const a = acc(key); (a ? info : warn).push(`${where}: unknown key "${C.trunc(key, 60)}" (npm warns "Unknown project config")${a ? '  (accepted: ' + a.reason + ')' : ''}`); }
      else info.push(`${where}: ${key}=${val}`);
    });
  }
  const status = fail.length ? 'FAIL' : warn.length ? 'WARN' : 'PASS';
  C.emit({ id: '17', cls: 'critical', title: '.npmrc content', status,
    summary: npmrcs.length === 0 ? 'no .npmrc files' : status === 'PASS' ? `${npmrcs.length} file(s), only harmless keys` : `${fail.length} dangerous, ${warn.length} odd lines in ${npmrcs.join(', ')}`,
    evidence: [...fail.map((s) => 'FAIL ' + s), ...warn.map((s) => 'WARN ' + s), ...info.map((s) => 'ok   ' + s)] });
}

// ---- 18. Replit, git hooks, CI, husky ----------------------------------------------------------------
{
  const ev = []; let status = 'PASS';
  const bump = (lvl) => { if (lvl === 'FAIL') status = 'FAIL'; else if (lvl === 'WARN' && status !== 'FAIL') status = 'WARN'; };
  // automation files can be accepted with kind "automation" and the file path as pattern (FAIL-level content never is)
  const acc = (f) => C.allowed(allowlist, 'automation', f);
  for (const f of files.filter((x) => /(^|\/)\.replit$/.test(x))) {
    const txt = read(f) || '';
    const pm = txt.match(/\[postMerge\][\s\S]*?path\s*=\s*"([^"]+)"/);
    if (pm) { const a = acc(f); if (!a) bump('WARN'); const sp = path.join(path.dirname(f), pm[1]); const body = read(sp); ev.push(`${a ? 'ok  ' : 'WARN'} ${f}: [postMerge] runs ${pm[1]} on Replit after merges${body ? ' -> ' + C.trunc(body.replace(/^#!.*\n/, ''), 160) : ' (file missing)'}${a ? '  (accepted: ' + a.reason + ')' : ''}`); }
    const pb = txt.match(/\[deployment\.postBuild\][\s\S]*?args\s*=\s*(\[[^\]]*\])/);
    if (pb) ev.push(`INFO ${f}: deployment.postBuild args = ${pb[1]}`);
    const run = txt.match(/^run\s*=\s*(.+)$/m); if (run) ev.push(`INFO ${f}: run = ${run[1]}`);
    const onBoot = txt.match(/^onBoot\s*=\s*(.+)$/m); if (onBoot) { bump('WARN'); ev.push(`WARN ${f}: onBoot = ${onBoot[1]}`); }
    if (!pm && !pb && !run && !onBoot) ev.push(`INFO ${f}: no run/postMerge/onBoot hooks`);
  }
  // scripts that other tools run automatically
  for (const f of files.filter((x) => /(^|\/)(scripts\/post-merge\.sh|\.husky\/[^/]+|lefthook\.ya?ml|\.pre-commit-config\.yaml|\.github\/workflows\/[^/]+|\.gitlab-ci\.yml|Makefile|Dockerfile|docker-compose\.ya?ml)$/.test(x))) {
    const txt = read(f) || '';
    const bad = /\b(curl|wget)\b[^|\n]*\|\s*(ba)?sh|base64\s+-d|eval\s*\(|npm\s+(install|i)\b|pnpm\s+install|secrets\./;
    const isFail = /\b(curl|wget)\b[^|\n]*\|\s*(ba)?sh|base64\s+-d/.test(txt);
    const a = isFail ? null : acc(f);
    const lvl = isFail ? 'FAIL' : a ? 'ok  ' : 'WARN';
    if (!a) bump(lvl);
    const lines = txt.split('\n').map((l, i) => bad.test(l) ? `${i + 1}: ${C.trunc(l, 100)}` : null).filter(Boolean);
    ev.push(`${lvl} ${f}: automation script (${txt.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length} lines)${lines.length ? ' notable: ' + lines.join(' | ') : ''}${a ? '  (accepted: ' + a.reason + ')' : ''}`);
  }
  // git hooks actually installed in .git/hooks and core.hooksPath
  try {
    const hooksDir = path.join(repo, '.git', 'hooks');
    const live = fs.existsSync(hooksDir) ? fs.readdirSync(hooksDir).filter((h) => !h.endsWith('.sample')) : [];
    if (live.length) { bump('WARN'); live.forEach((h) => ev.push(`WARN .git/hooks/${h}: active git hook (runs on git operations): ${C.trunc(fs.readFileSync(path.join(hooksDir, h), 'utf8'), 120)}`)); }
    else ev.push('ok   .git/hooks: only .sample files (no active hooks)');
    let hp = ''; try { hp = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* unset */ }
    if (hp) { bump('WARN'); ev.push(`WARN git core.hooksPath = ${hp}`); }
  } catch { /* not a git repo */ }
  // package.json scripts that run with a bare "npm start"/"dev" are the child's choice; list them
  for (const f of files.filter((x) => /(^|\/)package\.json$/.test(x))) {
    const pj = C.tryReadJSON(path.join(repo, f)); if (!pj || !pj.scripts) continue;
    const odd = Object.entries(pj.scripts).filter(([, v]) => /\b(curl|wget|bash -c|sh -c|node -e|base64|sudo|rm -rf \/|chmod \+x|\.\/[^ ]*\.sh)\b/.test(v));
    if (odd.length) { bump('WARN'); odd.forEach(([k, v]) => ev.push(`WARN ${f} scripts.${k}: ${C.trunc(v, 120)}`)); }
    if (pj.stackblitz) ev.push(`INFO ${f}: stackblitz.installDependencies=${pj.stackblitz.installDependencies}, startCommand=${JSON.stringify(pj.stackblitz.startCommand)} (only runs inside StackBlitz)`);
  }
  C.emit({ id: '18', cls: 'critical', title: 'Automation hooks (Replit, git hooks, CI, scripts)', status,
    summary: status === 'PASS' ? 'no automation that would run code on this host' : `${ev.filter((e) => e.startsWith('WARN') || e.startsWith('FAIL')).length} automation entry point(s) to know about`, evidence: ev });
}

// ---- 19. AI agent configuration (.claude, .agents, .mm3, .cursor, .codex) ----------------------------
{
  const ev = []; let status = 'PASS';
  const bump = (lvl) => { if (lvl === 'FAIL') status = 'FAIL'; else if (lvl === 'WARN' && status !== 'FAIL') status = 'WARN'; };
  const settings = files.filter((f) => /(^|\/)\.claude\/settings[^/]*\.json$/.test(f));
  for (const f of settings) {
    const j = C.tryReadJSON(path.join(repo, f));
    if (!j) { bump('WARN'); ev.push(`WARN ${f}: unreadable JSON`); continue; }
    if (j.hooks && Object.keys(j.hooks).length) {
      bump('WARN');
      for (const [ev_, arr] of Object.entries(j.hooks)) {
        const cmds = JSON.stringify(arr);
        const lvl = /curl|wget|base64|\beval\b|rm -rf|\.ssh|\.npmrc|webhook/.test(cmds) ? 'FAIL' : 'WARN';
        bump(lvl);
        ev.push(`${lvl} ${f}: hooks.${ev_} = ${C.trunc(cmds, 200)} (runs shell commands automatically inside Claude Code)`);
      }
    }
    const allow = (j.permissions && j.permissions.allow) || [];
    const risky = allow.filter((a) => /Bash\((rm|curl|wget|sudo|npm (install|i|ci|run)|npx|sh|bash|chmod|ssh|scp)\b|Bash\(\*?\)|^Bash$|WebFetch|mcp__.*\*|Write|Edit/.test(a));
    if (risky.length) { bump('WARN'); ev.push(`WARN ${f}: broad permissions pre-approved: ${risky.join(', ')}`); }
    if (j.enabledPlugins) ev.push(`INFO ${f}: enabledPlugins = ${Object.keys(j.enabledPlugins).join(', ')}`);
    if (j.env) { bump('WARN'); ev.push(`WARN ${f}: env = ${C.trunc(JSON.stringify(j.env), 160)}`); }
    if (j.mcpServers || j.enableAllProjectMcpServers) { bump('WARN'); ev.push(`WARN ${f}: MCP servers configured/enabled: ${C.trunc(JSON.stringify(j.mcpServers || j.enableAllProjectMcpServers), 160)}`); }
    if (!j.hooks && !risky.length && !j.env && !j.mcpServers) ev.push(`ok   ${f}: no hooks, no broad permissions`);
  }
  for (const f of files.filter((x) => /(^|\/)\.mcp\.json$|(^|\/)\.cursor\/|(^|\/)\.codex\/|(^|\/)\.windsurf/.test(x))) { bump('WARN'); ev.push(`WARN ${f}: AI tool config present (review for auto-run servers/commands)`); }
  const agentFiles = files.filter((f) => /(^|\/)(\.agents|\.mm3|\.claude)\//.test(f) && !/settings[^/]*\.json$/.test(f));
  if (agentFiles.length) ev.push(`INFO ${agentFiles.length} AI memory/ledger file(s): ${agentFiles.slice(0, 8).join(', ')}${agentFiles.length > 8 ? ', …' : ''}`);
  const claudeMds = files.filter((f) => /(^|\/)(CLAUDE|AGENTS|GEMINI|\.cursorrules|replit)\.md$/i.test(f));
  if (claudeMds.length) ev.push(`INFO agent instruction files: ${claudeMds.join(', ')} (scanned for injection text in check 20)`);
  C.emit({ id: '19', cls: 'critical', title: 'AI-agent settings (.claude/.agents/.mm3/.mcp)', status,
    summary: status === 'PASS' ? `${settings.length} settings file(s); no hooks, no broad pre-approved permissions, no MCP servers` : 'agent settings contain hooks/permissions/servers that need a look', evidence: ev });
}

// ---- 20. Prompt-injection style text in docs / memory / comments -------------------------------------
{
  const PATTERNS = [
    [/ignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts?)/i, 'ignore previous instructions'],
    [/disregard\s+(all\s+)?(previous|prior|your)\s+(instructions|rules|guidelines)/i, 'disregard instructions'],
    [/you\s+are\s+now\s+(a|an|in)\b[^.\n]{0,40}(mode|assistant|agent|developer)/i, 'role override'],
    [/\b(do\s+not|don'?t|never)\s+(tell|inform|mention|show|reveal)\s+(this\s+to\s+)?(the\s+)?(user|owner|human|corey|parent)/i, 'hide from the user'],
    [/\b(run|execute|exec)\s+(the\s+following\s+)?(command\s+)?[`"']?\s*(curl|wget|bash|sh|powershell|sudo|rm\s+-rf|npm\s+install|npx)\b/i, 'instruction to run a command'],
    [/\b(send|post|upload|exfiltrate|forward)\s+(it|this|them|the\s+(file|data|key|token|contents?|env|secrets?)|all\s+\w+)\s+to\s+(https?:|[a-z0-9.-]+\.(com|net|io|site|sh))/i, 'send data to an external destination'],
    [/\bsystem\s+prompt\b/i, 'mentions system prompt'],
    [/\b(without|no)\s+(asking|confirmation|permission)\b[^.\n]{0,60}\b(install|run|execute|delete|push|commit)/i, 'act without confirmation'],
    [/base64\s*(-d|--decode|decode)/i, 'base64 decode instruction'],
    [/\bAI\s+(agent|assistant|model)s?\s*[:,]\s*(please\s+)?(run|install|execute|fetch|download|disable|skip)/i, 'addressed to AI agents'],
    [/<!--[^>]*\b(ignore|instruction|assistant|agent|claude|gpt)\b[^>]*-->/i, 'hidden HTML comment addressed to an assistant'],
    [/​|‌|‍|⁠|﻿(?!^)/, 'zero-width characters (hidden text)'],
    [/[‪-‮⁦-⁩]/, 'bidirectional override characters (text can render differently from how it reads)'],
  ];
  const targets = files.filter((f) => /\.(md|mdx|txt|markdown|rst|json|ya?ml|toml|html?)$|(^|\/)\.(agents|claude|cursor|mm3|github)\//i.test(f) && !/package-lock\.json$|(^|\/)reports\//.test(f));
  const hits = [];
  let scanned = 0;
  for (const f of targets) {
    if (C.allowed(allowlist, 'injection', f)) continue;
    const txt = read(f); if (txt === null || txt.length > 2 * 1024 * 1024) continue;
    scanned++;
    txt.split('\n').forEach((line, i) => {
      for (const [re, why] of PATTERNS) if (re.test(line)) { hits.push(`${f}:${i + 1} (${why}) ${C.trunc(line, 120)}`); break; }
    });
  }
  C.emit({ id: '20', cls: 'critical', title: 'Prompt-injection style text in docs, memory and config', status: hits.length ? 'WARN' : 'PASS',
    summary: hits.length ? `${hits.length} line(s) read like instructions aimed at an AI assistant or a human operator` : `no injection-style phrases in ${scanned} text/config files`, evidence: hits });
}

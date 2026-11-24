'use strict';
// Per-package registry metadata via `npm view <name>@<version> --json`, cached, rate-limited.
// Usage: node registry-meta.js --lock <package-lock.json> [--cache-dir dir] [--min-age-days 14] [--concurrency 4] [--offline]
// Emits check 11 (release age / maintainers / deprecation / repository / provenance).
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const C = require('./common');

const lockPath = path.resolve(C.arg('--lock'));
const cacheDir = path.resolve(C.arg('--cache-dir', path.join(process.env.HOME || '/tmp', '.cache', 'beta-games-security-scan', 'registry')));
const MIN_AGE_DAYS = parseInt(C.arg('--min-age-days', '14'), 10);
const CONCURRENCY = parseInt(C.arg('--concurrency', '4'), 10);
const CACHE_TTL_MS = 7 * 24 * 3600 * 1000;
const offline = C.flag('--offline');

const lock = C.readJSON(lockPath);
const pkgs = lock.packages || {};
const targets = new Map();
for (const [k, e] of Object.entries(pkgs)) {
  if (!k || e.link || e.inBundle || !e.version) continue;
  const name = e.name || k.replace(/^.*node_modules\//, '');
  targets.set(`${name}@${e.version}`, { name, version: e.version });
}

// Versions in the last accepted lockfile (git HEAD): only NEW or CHANGED versions get age / deprecation warnings.
const baseline = new Set();
const basePath = C.arg('--baseline');
if (basePath && fs.existsSync(basePath)) {
  try {
    for (const [k, e] of Object.entries(C.readJSON(path.resolve(basePath)).packages || {})) {
      if (!k || e.link || e.inBundle || !e.version) continue;
      baseline.add(`${e.name || k.replace(/^.*node_modules\//, '')}@${e.version}`);
    }
  } catch (_) { /* unreadable baseline: warn on everything, as before */ }
}

fs.mkdirSync(cacheDir, { recursive: true });
const cacheFile = (id) => path.join(cacheDir, encodeURIComponent(id) + '.json');

function fromCache(id) {
  const f = cacheFile(id);
  try {
    const st = fs.statSync(f);
    if (Date.now() - st.mtimeMs > CACHE_TTL_MS && !offline) return null;
    return C.readJSON(f);
  } catch { return null; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run npm view from the cache dir (no project .npmrc in scope) with the registry forced.
function npmView(id) {
  return new Promise((resolve) => {
    const args = ['view', id, '--json', '--registry=https://registry.npmjs.org', '--loglevel=error', '--no-update-notifier', '--no-fund', '--ignore-scripts',
      'name', 'version', 'time', 'maintainers', 'deprecated', 'repository', 'dist.attestations', 'dist.signatures', '_npmUser', 'homepage'];
    const child = spawn('npm', args, { cwd: cacheDir, env: { ...process.env, npm_config_registry: 'https://registry.npmjs.org', NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => child.kill('SIGKILL'), 60000);
    child.on('close', (code) => {
      clearTimeout(t);
      let data = null;
      try { data = JSON.parse(out); } catch { data = null; }
      if (code !== 0 || !data || data.error) {
        const msg = (data && data.error && (data.error.summary || data.error.code)) || err.trim().split('\n').pop() || `exit ${code}`;
        resolve({ error: msg });
      } else resolve(data);
    });
  });
}

async function main() {
  const ids = [...targets.keys()];
  const results = new Map();
  let fetched = 0, cached = 0, errors = 0;
  const queue = ids.slice();
  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      const c = fromCache(id);
      if (c) { results.set(id, c); cached++; continue; }
      if (offline) { results.set(id, { error: 'offline' }); continue; }
      const data = await npmView(id);
      fetched++;
      if (data.error) errors++;
      else fs.writeFileSync(cacheFile(id), JSON.stringify({ ...data, _fetchedAt: new Date().toISOString() }));
      results.set(id, data);
      await sleep(150); // be polite to the registry
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const now = Date.now();
  const fresh = [], dormant = [], brandNew = [], deprecated = [], noRepo = [], nonMaintainer = [], notFound = [], ciPublished = [];
  const knownQuiet = []; // age / deprecation notes for versions already in the last accepted lockfile (not warned)
  let withProvenance = 0, withSignature = 0, ok = 0;
  for (const [id, d] of results) {
    const { name, version } = targets.get(id);
    const known = baseline.has(id);
    if (d.error) { notFound.push(`${id}: ${d.error}`); continue; }
    ok++;
    const time = d.time || {};
    const published = time[version] ? Date.parse(time[version]) : NaN;
    const ageDays = isNaN(published) ? NaN : (now - published) / 86400000;
    const versionsSorted = Object.entries(time).filter(([v]) => v !== 'created' && v !== 'modified').map(([v, t]) => [v, Date.parse(t)]).sort((a, b) => a[1] - b[1]);
    const idx = versionsSorted.findIndex(([v]) => v === version);
    const prev = idx > 0 ? versionsSorted[idx - 1] : null;
    const created = time.created ? Date.parse(time.created) : NaN;
    if (!isNaN(ageDays) && ageDays < MIN_AGE_DAYS && known) {
      knownQuiet.push(`${id}: published ${ageDays.toFixed(1)} days ago`);
    } else if (!isNaN(ageDays) && ageDays < MIN_AGE_DAYS) {
      fresh.push(`${id}: published ${ageDays.toFixed(1)} days ago (${time[version].slice(0, 10)})${prev ? `, previous ${prev[0]} ${((published - prev[1]) / 86400000).toFixed(0)} days earlier` : ''}`);
      if (prev && (published - prev[1]) / 86400000 > 365) dormant.push(`${id}: first release in ${((published - prev[1]) / 86400000).toFixed(0)} days (dormant package suddenly updated)`);
    }
    if (!isNaN(created) && (now - created) / 86400000 < 90 && versionsSorted.length < 5) brandNew.push(`${id}: package first published ${((now - created) / 86400000).toFixed(0)} days ago with only ${versionsSorted.length} version(s)`);
    if (d.deprecated && known) knownQuiet.push(`${id}: deprecated (${C.trunc(d.deprecated, 60)})`);
    else if (d.deprecated) deprecated.push(`${id}: ${C.trunc(d.deprecated, 120)}`);
    const repo = d.repository && (typeof d.repository === 'string' ? d.repository : d.repository.url);
    if (!repo) noRepo.push(id);
    const maint = (d.maintainers || []).map((m) => (typeof m === 'string' ? m.split(' ')[0] : m.name)).filter(Boolean);
    const pub = d._npmUser && (d._npmUser.name || String(d._npmUser).split(' ')[0]);
    const hasProvenance = !!(d['dist.attestations'] || (d.dist && d.dist.attestations));
    const ciPublisher = /^(GitHub|GitHub Actions|github-actions(\[bot\])?|GitLab|gitlab-ci)$/i.test(pub || '');
    // Trusted publishing (OIDC from CI) shows up as publisher "GitHub" with a provenance attestation: that is the good case.
    if (pub && maint.length && !maint.includes(pub)) {
      if (ciPublisher && hasProvenance) ciPublished.push(id);
      else nonMaintainer.push(`${id}: published by "${pub}" who is not a current maintainer (${maint.join(', ')})${hasProvenance ? ' [has provenance]' : ' [no provenance]'}`);
    }
    if (hasProvenance) withProvenance++;
    if (d['dist.signatures'] || (d.dist && d.dist.signatures)) withSignature++;
  }
  C.meta('registry', { packages: ids.length, fetched, cached, errors, withProvenance, withSignature, minAgeDays: MIN_AGE_DAYS });

  if (offline && ok === 0) {
    C.emit({ id: '11', cls: 'critical', title: 'Registry metadata (release age, maintainers, deprecation)', status: 'SKIP', summary: `--offline and no cached metadata for ${ids.length} packages`, evidence: [] });
    return;
  }
  const ev = [];
  let status = 'PASS';
  const push = (label, arr, level) => { if (!arr.length) return; if (level === 'WARN') status = status === 'FAIL' ? 'FAIL' : 'WARN'; arr.forEach((s) => ev.push(`${level} ${label}: ${s}`)); };
  push('too-new', fresh, 'WARN');
  push('dormant-then-updated', dormant, 'WARN');
  push('brand-new-package', brandNew, 'WARN');
  push('non-maintainer-publish', nonMaintainer, 'WARN');
  push('deprecated', deprecated, 'WARN');
  push('registry-lookup-failed', notFound, 'WARN');
  if (knownQuiet.length) ev.push(`INFO already in the last accepted lockfile, so not warned (${knownQuiet.length}): ${knownQuiet.slice(0, 12).join('; ')}${knownQuiet.length > 12 ? '; …' : ''}`);
  if (ciPublished.length) ev.push(`INFO published from CI via trusted publishing with provenance (${ciPublished.length}): ${ciPublished.slice(0, 12).join(', ')}${ciPublished.length > 12 ? ', …' : ''}`);
  if (noRepo.length) ev.push(`INFO no repository field (${noRepo.length}): ${noRepo.slice(0, 20).join(', ')}${noRepo.length > 20 ? ', …' : ''}`);
  ev.push(`INFO provenance attestations: ${withProvenance}/${ok} versions; registry signatures: ${withSignature}/${ok}`);
  ev.push(`INFO metadata source: ${fetched} fetched now, ${cached} from cache (${cacheDir})`);
  const summary = status === 'PASS'
    ? `${ok}/${ids.length} versions checked: no new or changed version younger than ${MIN_AGE_DAYS} days or deprecated, no maintainer anomalies${knownQuiet.length ? ` (${knownQuiet.length} note(s) on versions already accepted in the last commit are in the evidence)` : ''}`
    : `${fresh.length} too-new (<${MIN_AGE_DAYS}d), ${dormant.length} dormant-then-updated, ${brandNew.length} brand-new, ${nonMaintainer.length} non-maintainer publishes, ${deprecated.length} deprecated, ${notFound.length} lookup failures`;
  C.emit({ id: '11', cls: 'critical', title: 'Registry metadata (release age, maintainers, deprecation)', status, summary, evidence: ev });
}

main().catch((e) => { C.emit({ id: '11', cls: 'critical', title: 'Registry metadata', status: 'WARN', summary: 'could not run: ' + e.message, evidence: [] }); });

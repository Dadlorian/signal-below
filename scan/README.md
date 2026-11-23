# security-scan: how to use it, what it means, how to accept a risk

Read-only scanner for this repo. It never edits the son's files, never installs, never runs
project code. Everything it does is reading files plus read-only registry lookups.

## Run

```bash
./security-scan.sh                  # full scan (needs network for audit + registry metadata)
./security-scan.sh --offline        # no network at all
./security-scan.sh --quick          # skip registry metadata, zip extraction, git patch scan
./security-scan.sh --no-audit       # skip npm audit / audit signatures only
./security-scan.sh --report-dir DIR # default ./reports
./security-scan.sh --help
scan/selftest.sh                    # prove the detectors fire on a synthetic malicious fixture (scratch dir only)
scan/contained-install.sh           # install inside docker, never on the host, then re-scan the result
scan/contained-install.sh --dry-run # show what it would run
```

Output: `reports/security-report-YYYY-MM-DD-HHMM.md` (human) and `reports/latest.json` (machine).
Exit code 1 when any check FAILs, else 0. A full run takes a few minutes; `--quick` about 30 s.

Environment overrides: `SCAN_CACHE_DIR` (registry metadata cache), `SCAN_SCRATCH` (scratch base),
`SCAN_TUNNEL_HOST` (default `signal.gamelab.link`).

## Risk rubric

Every check has a **status** and a **class**.

| status | meaning |
|---|---|
| FAIL | very likely malicious or definitely unsafe to proceed (pipe-to-shell installer, non-registry package, secret in a file, redirected registry ...) |
| WARN | needs a human look; often fine once understood |
| INFO | inventory, counts, things listed for transparency |
| PASS | nothing found by this check |
| SKIP | not run (option or missing tool); the verdict says so |

| class | examples | effect of a WARN |
|---|---|---|
| critical | lockfile sources, install scripts, lookalike names, registry metadata, node_modules IOCs, .npmrc, hooks, secrets | verdict becomes MEDIUM |
| hygiene | dev-server exposure, innerHTML with variables, large files, publish-time scripts | verdict stays LOW, item is listed |

Verdict:

- **HIGH** - any FAIL. Do not install or launch. Read the file:line, decide, re-run.
- **MEDIUM** - no FAIL, at least one critical-class WARN. A human decides before installing.
- **LOW** - no FAIL, no critical-class WARN. "No indicators found by these checks." Not a proof of safety;
  the report's "Residual risk" section says what a static scan cannot rule out.

## Check map

| id | what |
|---|---|
| 1, 2, 21 | sensitive files (also git-ignored ones present on disk), secrets + e-mail addresses, binaries/executables/symlinks |
| 3 | every lockfile entry resolves to `https://registry.npmjs.org` with sha512; flags http/git/file/link/alias and tarball-name mismatch |
| 4, 5, 6 | install-time scripts (package.json + lockfile `hasInstallScript` vs allowlist), floating/non-registry specs, package.json vs lockfile sync |
| 10 | lookalike names: edit distance to a built-in list of popular packages, scope confusion, homoglyphs, lure words |
| 11 | `npm view name@version` per package: age < 14 days, dormant-then-updated, brand-new, non-maintainer publish, deprecated, no repository, provenance coverage. Cached 7 days |
| 12 | lockfile and package.json diff against git HEAD: added/removed/changed, major downgrades, same-version-different-tarball (FAIL) |
| 13 | installed `node_modules/.package-lock.json` vs `package-lock.json` drift |
| 9, 15 | `npm audit` with advisory titles; `npm audit signatures` (needs node_modules) |
| 14a-f | static read of every installed package: lifecycle scripts, bin shadowing, FAIL-level IOCs, WARN-level capabilities, allowlisted hits, native binaries |
| 7a-e, 8, 16 | code patterns (triaged), external hosts vs allowlist, dev-server exposure + tunnel host in `allowedHosts` |
| 17-20 | `.npmrc`, Replit/git hooks/CI scripts, `.claude`/`.agents`/`.mm3`/`.mcp` settings, prompt-injection phrases |
| 22, 26a | zip listing (traversal, symlinks, sensitive entries, node_modules inside), extraction into scratch, diff vs tree, IOC scan of the zip content |
| 23-25 | secrets in git history, sensitive files ever committed, large blobs |
| 30a-f | same as 14 but for the tree produced by `scan/contained-install.sh` |

Rules live in `scan/lib/iocs.js` (one table, shared by the code scan and the node_modules scan).

## Accepting a risk

Edit `scan/allowlist.txt`. One line per item:

```
kind|pattern|reason|YYYY-MM-DD
```

Example: the report shows `[14d] detect-libc/lib/detect-libc.js:33 [CHILD_PROCESS] ...`. You read the file,
see it only runs `ldd --version` to pick a glibc or musl binary, and add:

```
pkg-ioc|detect-libc|asks "ldd --version" to choose the native binary flavour|2026-11-22
```

Kinds: `install-script` (package may run an install script), `pkg-ioc` (`name` for WARN rules, `name:RULE_ID`
for one rule incl. FAIL-level), `pkg-name` (skip lookalike check), `bin` (`package:bin`), `code` (path glob;
`path:RULE_ID` or `path:*` for FAIL-level), `host`, `injection`, `secret` (fixtures only), `file`, `spec`
(floating version of a named dependency), `npmrc` (`file:key`), `automation` (hook/CI file path), `advisory`
(GHSA id or package, moderate/low only). Patterns are globs. Every entry is
printed in the report with how many hits it absorbed, and allowlisted hits still appear in checks 7d / 14e,
so nothing is silently hidden. Never add an entry you have not read the hit for.

## Containment

`scan/contained-install.sh` copies the project to scratch, hardens the copy's `.npmrc`, runs
`npm ci --ignore-scripts` in `node:22-bookworm-slim` as your uid with `--cap-drop ALL`,
`--security-opt no-new-privileges`, read-only root fs, memory/pid limits, project mounted read-only,
then runs `npm audit signatures` and the static node_modules scan on the result. Optional
`--run-esbuild-postinstall` runs only esbuild's postinstall with the network off. The one-page explanation
and the residual risk are in the header of that script. If docker/podman are absent the script prints a
bubblewrap fallback and exits 3 without running anything.

## What this cannot do

Prove absence of malware. Plain, unobfuscated malicious JavaScript that avoids these patterns, a correctly
signed compromised version older than the age window, or native binaries doing something unexpected are
not detected. It also says nothing about run time: `vite --host` listens on every interface; serve the
production build behind the tunnel instead.

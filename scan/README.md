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

## New things (what to check when a zip brings something we don't already trust)

Known items are quiet because they are in `allowlist.txt`. When a report shows something new:

- **New npm package** (check [12] ADDED/CHANGED). Already automated: registry source and integrity [3],
  install scripts [4], unpinned spec [5], lookalike name [10], release age / dormant / non-maintainer /
  deprecated [11], advisories [9], signatures [15], and after the contained install the installed-file
  checks [30a-f]. Still a human/Claude job: does his `src/` actually import it (if not, it should not
  be there); `npm view <name> --json` for maintainers and release history; weekly downloads
  (api.npmjs.org/downloads/point/last-week/<name>; very low for a utility deserves a second look); what
  it drags in (count in [12]); native binaries [30f]. Nothing goes in the allowlist for a plain new
  package: accepting it is committing its lockfile.
- **New install script.** Read the script and the file it runs. Accept only if it does one local thing
  (picking a binary, building). Add `install-script|<name>|what it does|date`.
- **New external host** (check [8]). Who owns it, and is it read-only (fonts, images) or does data go
  to it (fetch/POST/WebSocket means friends' data leaves their browsers)? A CDN `<script>` should become
  a bundled dependency. Add `host|<hostname>|why the game needs it|date`.
- **New file type or binary** (check [21]). `.wasm/.node/.so/.exe/.dll`: where from, can it be rebuilt.
  `.sh/.ps1/.bat`: read it and find who calls it. `.env/.pem/.key`: a finding, never overlay it.
- **New script or config setting** (checks [4], [16], [18]). Read it. `curl|sh`, `node -e`, unknown
  `npx`, env dumps or anything touching `~` means stop. New vite `plugins`, `define`, `server.proxy` or
  `allowedHosts: true`: read them (config files run at build time). Add `automation|<path>|reason|date`.
- **Adding to the registry.** One line, `kind|pattern|reason|date`, only after reading the hit, with the
  reason saying what was read. Re-run the scan once and delete the superseded report.

For a judgment call (is this new thing safe to host?), get an MM3 verdict and cite the MM3-#### id.

## Appendix: rule sources (traceability)


Each scanner rule below is tied to the documentation it was derived from, so it can be re-checked when
vite, npm or docker change. Doc lookups were made with Context7 on 2026-11-22; versions noted per section.
Rules live in `scan/lib/iocs.js` (pattern table) and `scan/lib/code-scan.js` (vite structural analysis).

### Vite (docs for v6.4.x, `docs/config/server-options.md` in github.com/vitejs/vite)

| rule id | doc statement | scanner behaviour |
|---|---|---|
| `VITE_ALLOWED_HOSTS_TRUE` | `server.allowedHosts` default `[]`; `true` allows any host and enables DNS-rebinding source-code theft (advisory GHSA-vg6x-rcgg-rjx6) | FAIL when `true` in `server` or `preview` |
| `VITE_ALLOWED_HOSTS_LIST` | explicit list of hostnames | info; tunnel hostname (`--tunnel-host`, default `signal.gamelab.link`) must be present in both `server` and `preview` |
| `TUNNEL_HOST_MISSING` | without the hostname in the list vite answers "Blocked request" | REGRESSION (info, not a security fail): the public site is down, nothing is exposed |
| `VITE_ALLOWED_HOSTS_MISSING` | default allows only localhost and local IPs | WARN only when `package.json` starts vite with `--host` (otherwise harmless) |
| `VITE_HOST_ALL` / `VITE_EXPOSED` | `server.host` / `--host` = listen on all interfaces (LAN / public) | WARN (hygiene) |
| `VITE_FS_STRICT_FALSE` | `server.fs.strict` default `true` restricts serving to the workspace root | FAIL when `false` |
| `VITE_FS_DENY_WEAKENED` | `server.fs.deny` default `['.env', '.env.*', '*.{crt,pem}', '**/.git/**']` | FAIL when an override drops any default entry |
| `VITE_FS_ALLOW_BROAD` | `server.fs.allow` widens what can be served | WARN when it contains `/`, `..`, `~`, `/home`, `/etc`, `/root` |
| `VITE_CORS_TRUE` | `server.cors: true` lets any origin read dev-server responses | WARN |
| `VITE_PROXY` | `server.proxy` forwards requests to other servers | info (listed) |

Applied to every `vite.config.{js,ts,mjs,mts,cjs,cts}` in the tree, including `artifacts/*`, for both the
`server` and `preview` blocks. Source: https://github.com/vitejs/vite/blob/main/docs/config/server-options.md
and https://github.com/vitejs/vite/blob/main/docs/config/preview-options.md ; advisory
https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6

### npm (docs v11.19.1; this host runs npm 11.10.1 / node 22.20.0, so every command is feature-detected)

| check | doc statement | scanner behaviour |
|---|---|---|
| [15] `npm audit signatures` | verifies registry signatures and provenance attestations of the installed/locked tree | run on the host against the lockfile (JSON gives invalid/missing lists only) and in full inside `scan/contained-install.sh` after `npm ci`. Missing provenance is info, not WARN: only packages that publish provenance have it |
| [9] `npm audit` | reports known advisories by severity | FAIL on critical/high; WARN on moderate/low unless accepted by GHSA id (kind `advisory`) |
| contained install uses `npm ci` | lockfile-enforcing install: wipes node_modules, errors on package.json/lockfile mismatch | `npm ci --ignore-scripts` is the only install command the tooling ever issues; [6] pre-checks the mismatch |
| `--ignore-scripts` | disables lifecycle scripts for the install | always passed explicitly (and via the hardened `.npmrc` copy); not reliant on newer `deny-scripts` behaviour |
| [27] `npm install-scripts ls` | newer npm lists dependencies with unreviewed install scripts (read-only); `approve`/`deny` edit package.json | `ls` is run only if the subcommand exists; approve/deny are never called. On npm 11.10.1 the command is absent and an INFO line says so |
| [4] `allowScripts` field | newer npm reads `allowScripts` in package.json to pre-approve dependency install scripts | WARN if the field exists in any of the son's package.json files |

Source: https://docs.npmjs.com/cli/v11/commands/npm-audit , https://docs.npmjs.com/cli/v11/commands/npm-ci ,
https://docs.npmjs.com/cli/v11/commands/npm-install-scripts , https://docs.npmjs.com/cli/v11/using-npm/scripts

### Docker (`docker run` reference) used by `scan/contained-install.sh`

| flag | effect | why here |
|---|---|---|
| `--user <uid>:<gid>` | process runs as that uid, not root | a package script cannot write outside the mounted work dir |
| `--cap-drop ALL` | drops every Linux capability | no raw sockets, no mount, no ptrace, no chown of foreign files |
| `--security-opt no-new-privileges` | setuid/setgid binaries cannot raise privileges | blocks the classic escalation path |
| `--read-only` + `--tmpfs /tmp:rw,noexec,nosuid` | root filesystem read-only; writes only to named mounts; /tmp cannot host executables | the image cannot be modified and nothing dropped in /tmp can run |
| `--memory 2g --pids-limit 512` | resource caps | a fork bomb or miner stalls instead of taking the host |
| `--network bridge` (stage 1) / `--network none` (stage 2) | registry access only while downloading; no network while any script runs | downloads need the registry; the optional esbuild postinstall runs fully offline |
| `-v copy:/src:ro` | project copy mounted read-only | nothing in the container can alter the inputs |
| `--rm` | container removed on exit | no leftover state between runs |

Source (Context7, library `/docker/docs`, 2026-11-22): `data/cli/engine/docker_container_run.yaml` sections
"--security-opt" (no-new-privileges: "commands that raise privileges such as su or sudo no longer work"),
"Mount tmpfs (--tmpfs)" (options as `mount -t tmpfs -o`, example `rw,noexec,nosuid,size=...`), "Mount volume
read-only (--read-only)" ("prohibiting writes to locations other than the specified volumes"); and
`content/manuals/engine/network/drivers/none.md` (`--network none`: only the loopback interface exists).
Rendered at https://docs.docker.com/reference/cli/docker/container/run/ and
https://docs.docker.com/engine/network/drivers/none/ .
Residual: docker's bridge network cannot be restricted to one hostname without extra firewall rules; see the
header of `scan/contained-install.sh`.

### Refreshing these rules

1. Re-read the vite server-options page for the current major version; adjust the default `fs.deny` list and the
   `allowedHosts` semantics in `scan/lib/code-scan.js` if they changed.
2. Re-read the npm `install-scripts` docs; if `approve`/`deny` become default-on, keep calling only `ls`.
3. Re-run `scan/selftest.sh` after any rule change; it must still report 0 missed.

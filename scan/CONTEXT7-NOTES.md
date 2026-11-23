# Rule sources (traceability)

Each scanner rule below is tied to the documentation it was derived from, so it can be re-checked when
vite, npm or docker change. Doc lookups were made with Context7 on 2026-11-22; versions noted per section.
Rules live in `scan/lib/iocs.js` (pattern table) and `scan/lib/code-scan.js` (vite structural analysis).

## Vite (docs for v6.4.x, `docs/config/server-options.md` in github.com/vitejs/vite)

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

## npm (docs v11.19.1; this host runs npm 11.10.1 / node 22.20.0, so every command is feature-detected)

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

## Docker (`docker run` reference) used by `scan/contained-install.sh`

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

## Refreshing these rules

1. Re-read the vite server-options page for the current major version; adjust the default `fs.deny` list and the
   `allowedHosts` semantics in `scan/lib/code-scan.js` if they changed.
2. Re-read the npm `install-scripts` docs; if `approve`/`deny` become default-on, keep calling only `ls`.
3. Re-run `scan/selftest.sh` after any rule change; it must still report 0 missed.

# CLAUDE.md

## What this repo is

A family game repo. Corey's son builds a browser game ("The Signal Below", a Vite + React
dungeon crawler) on his laptop and sends zips of it. Corey hosts it on this server and
exposes it to the son's friends through a Cloudflare tunnel (https://signal.gamelab.link).
The son is learning and the code is AI-assisted, so every update is untrusted input.

## Rules

- Never change the son's code unprompted: `project-bolt-stackblitz-starters-kppnjtxg/` is his.
  No refactors, cleanups, formatting, dependency bumps or "fixes" there. Report problems to Corey
  and let him decide. Files at the repo root (this file, `security-scan.sh`, `scan/`, `reports/`)
  are ours to edit.
- Never run `npm install`, `npm ci`, `npm run dev`, `vite` or anything else that executes the
  son's code or package scripts on the host before the scan below passes. Treat a new zip like
  an unknown download.
- Never extract a zip into the repo to inspect it. Use a new empty directory in the scratchpad.
- Never claim "safe". Say "no indicators found by these checks" and state what a static scan
  cannot rule out.
- Do not commit, push, or publish unless Corey asks. Do not touch the Cloudflare tunnel config
  or restart `cloudflared` without asking, because friends are playing through it.

## Update workflow (every time a new zip or change arrives)

1. **Stage.** Put the zip in a new empty directory in the scratchpad (or the repo root if Corey
   already placed it there) and unzip there. Never overwrite the live project directly.
2. **Scan before install.** From the repo root, run `./security-scan.sh`. Use `--offline` only
   if there's no network. Read the generated report in `reports/`.
   - FAIL: stop. Tell Corey what fired and where. Do not install or launch.
   - WARN: explain each in plain language, say whether it is new since the last report, and
     let Corey decide.
   - PASS: continue.
3. **Show what changed.** Summarize the diff against the last known-good version: new or
   changed packages and versions, new files, changed scripts, config, URLs.
4. **Install in containment.** Use `scan/contained-install.sh` (docker is available on this
   host) rather than installing on the host. Install with `--ignore-scripts`. Use `npm ci`,
   not `npm install`, so the lockfile is honored.
5. **Re-scan the result.** The scan also checks installed `node_modules`.
6. **Launch.** Only then run the game, and only with Corey's go-ahead.
7. **Record.** Keep the report. Tell Corey the verdict in plain language, with the report path.

## How the game is hosted (since 2026-11-23)

The live site is a Docker container named `signal-below` (nginx serving the finished build, no
Node at runtime), on port 5173, which the Cloudflare tunnel points at. Bind it on all interfaces
(`-p 5173:8080`); a `127.0.0.1`-only bind gave the tunnel a 502.
The old user service `signal-web.service` is stopped and disabled. It ran `vite build` on the host
at every start, which is exactly what we avoid. Do not re-enable it.

To publish an update after the scan passes (about 20 seconds, brief blip for players):
```
cd project-bolt-stackblitz-starters-kppnjtxg/project
docker build -f ../../deploy/Dockerfile --build-context deploy=../../deploy -t signal-below:new .
docker rm -f signal-below
docker run -d --name signal-below --restart unless-stopped -p 5173:8080 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:new
```
Then check `https://signal.gamelab.link/` and `/docs/` return 200. Ask Corey before swapping.
Docs pages (`docs/`) are copied in as plain files, so they don't depend on his vite config.

## Things to check on every update

- `package.json`: new dependencies, anything unpinned (`latest`, `*`), lifecycle scripts
  (preinstall/install/postinstall/prepare), non-registry sources (git, URL, file).
- Lockfile: every package resolves from `registry.npmjs.org` with an integrity hash.
- `.npmrc`: no `registry=`, auth tokens, or `ignore-scripts=false`.
- `vite.config.ts`: `server.host`, `allowedHosts`, proxy and `fs` settings. The tunnel host
  `signal.gamelab.link` has to stay in `allowedHosts` for dev and preview, or the public site
  breaks. A past update dropped it.
- Network calls, new external URLs, `eval`, `innerHTML` with variable input, storage of secrets.
- Secrets or personal data in files or zips (`.env`, keys, tokens, emails).
- Leftover Replit template folders (`artifacts/api-server`, `lib/db`, `.replit`,
  `scripts/post-merge.sh`): not part of the game and must not be started.
- `vite --host` exposes the dev server to the network. For friends, prefer serving the
  production build (`vite build` then `vite preview` or static files) behind the tunnel.

## Known accepted items (as of 2026-11-22)

- `lucide-react: "latest"` is unpinned. The lockfile pins it. Always use `npm ci`.
- `npm audit`: 2 moderate findings in `postcss-selector-parser` via `@tailwindcss/typography`.
  It only affects the build step on the son's own CSS. Do not run `npm audit fix --force`.
- The son keeps pasting his start-up notes into `.npmrc`, which npm reads, so npm prints
  "Unknown project config" warnings. The notes already live in `.npmrc.txt`. On every update,
  after unzipping, replace `.npmrc` with the two comment lines below (Corey approved this
  on 2026-11-22). Check first that the old text is also in `.npmrc.txt`, and don't touch
  `.npmrc.txt`:
  `; Intentionally empty. npm reads this file, so no notes go here.`
  `; The start-up notes live in .npmrc.txt.`
  If the new `.npmrc` has real settings (`registry=`, `_authToken`, `ignore-scripts=false`),
  that is a scan finding. Don't overwrite it; ask Corey.
- `esbuild` and `fsevents` install scripts are expected.

## Talking to Corey

Plain language, not security jargon. Lead with the verdict (OK / needs a look / do not run),
then the few things that matter, then the report path. The son is learning, so any feedback
for him should be encouraging and framed as something to learn, never as blame.

## MM3

This repo has MM3 (`.mm3/`). For judgment calls about code ("is this update safe to host?")
get an MM3 verdict and cite the run id (MM3-####). Mark anything not from MM3 as your own
reading. When delegating to a helper, give it `mm3 agent delegate`, and check its reported
run ids against the ledger with `mm3 view MM3-####`.

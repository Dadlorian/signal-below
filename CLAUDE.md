# CLAUDE.md

## What this repo is

A family game repo. Corey's son builds a browser game ("The Signal Below", a Vite + React
dungeon crawler) on his laptop and sends zips of it. Corey hosts it on this server and
exposes it to the son's friends through a Cloudflare tunnel (https://signal.gamelab.link).
The son is learning and the code is AI-assisted, so every update is untrusted input.

The step-by-step update pipeline, the list of expected scan warnings, and the exact docker
commands all live in **one place**: `project-bolt-stackblitz-starters-kppnjtxg/project/UPDATE-INSTRUCTION.md`.
Read it before touching a zip and follow it in one pass. Do not re-derive it or add tooling.

## Rules

- Never change the son's code unprompted: everything under `project-bolt-stackblitz-starters-kppnjtxg/project/`
  except `UPDATE-INSTRUCTION.md` and `docs/` is his. No refactors, cleanups, formatting, dependency
  bumps or "fixes" there. Report problems to Corey and let him decide. Files at the repo root
  (this file, `security-scan.sh`, `scan/`, `deploy/`, `reports/`) are ours to edit.
- Never run `npm install`, `npm ci`, `npm run dev`, `vite` or anything else that executes the
  son's code or package scripts on the host. Installs happen only inside the container
  (`scan/contained-install.sh`), and only after the scan has no FAIL. Treat a new zip like an
  unknown download.
- Never extract a zip into the repo to inspect it. `./security-scan.sh` already unzips root zips to
  scratch; if you must look by hand, use a new empty scratchpad directory.
- One pass, one scan. Finish every doc and note edit first, then run `./security-scan.sh` once.
  Every run writes a report in `reports/`; extra runs only add noise.
- Never type a key-shaped string (an AWS-style access key, an `npm_` token, and so on) into any
  file, not even a fake one. The secrets check [2] reads our own docs and fails on it. Write
  "an AWS-style example key" instead. The git-history check [23] skips `security-scan.sh` and
  `scan/selftest.sh` on purpose (they hold the fake test keys); do not "fix" that.
- Never claim "safe". Say "no indicators found by these checks" and state what a static scan
  cannot rule out (the report's "Residual risk" section lists it).
- Do not commit, push, or publish unless Corey asks. Do not touch the Cloudflare tunnel config
  or restart `cloudflared` without asking, because friends are playing through it. Ask Corey
  before swapping the live container.

## What to look at in a new zip

Corey's two main worries are hidden `eval`/dynamic code and unapproved or unpinned npm packages.
The scanner covers both; check [22] lists what the zip changes (`DIFFERS` / `ONLY-IN-ZIP`).
Read the diff of anything in this list before overlaying it, and tell Corey:

- `package.json`: new dependencies, anything unpinned (`latest`, `*`), lifecycle scripts
  (preinstall/install/postinstall/prepare), non-registry sources (git, URL, file).
- Lockfile: every package resolves from `registry.npmjs.org` with an integrity hash.
- `.npmrc`: real settings (`registry=`, auth tokens, `ignore-scripts=false`) are a finding. His
  pasted start-up notes are not (see the pipeline, step 4).
- `vite.config.ts`: `server.host`, `allowedHosts`, proxy and `fs` settings.
- Network calls, new external URLs, `eval`, `innerHTML` with variable input, storage of secrets.
- Secrets or personal data in files (`.env`, keys, tokens, emails).
- Leftover Replit template folders (`artifacts/api-server`, `lib/db`, `.replit`,
  `scripts/post-merge.sh`): not part of the game and must never be started.

Vite and plugin version changes (up or down) are normal and not a risk by themselves. The scan
result matters, not the version number. A stale `node_modules` is rebuilt in the container.

## How the game is hosted (since 2026-11-23)

- The live site is a Docker container named `signal-below`: nginx serving the finished build,
  no Node at runtime. It publishes port 5173 on **all** interfaces (`-p 5173:8080`); the tunnel
  reaches it on the LAN address, so a `127.0.0.1`-only bind gives a 502. It restarts by itself
  (`--restart unless-stopped`).
- The old user service `signal-web.service` is stopped and disabled. It ran `vite build` on the
  host at every start, which is exactly what we avoid. Do not re-enable it.
- Everything for hosting lives in `deploy/` at the repo root. His code is never edited:
  - `deploy/nginx.conf`: hashed files in `/assets/` cached for a year (`immutable`; a new build
    means new names, so updates show up at once); the game page and guides are `no-cache`; text
    is gzip-compressed; `/api/*` and unknown files return a real 404; `/favicon.ico` returns 204;
    the game's own routes (`/play/...`) fall back to `index.html`.
  - `deploy/inject-fonts.js` runs after `vite build` and copies the Google Fonts URL from his
    `src/index.css` into the built `index.html` as a `<link>`. It skips quietly if his CSS changes.
  - Docs pages (`docs/`) are copied in as plain files.
- `allowedHosts` in his `vite.config.ts` only matters for `vite --host` / `vite preview`. The live
  site does not use them, so a missing `signal.gamelab.link` there no longer breaks the public
  site. Still worth a gentle note to him.

## Talking to Corey

Plain language, not security jargon. Lead with the verdict (OK / needs a look / do not run),
then the few things that matter, then the report path. The son is learning, so any feedback
for him should be encouraging and framed as something to learn, never as blame.

## MM3

This repo has MM3 (`.mm3/`). For judgment calls about code ("is this update safe to host?")
get an MM3 verdict and cite the run id (MM3-####). Mark anything not from MM3 as your own
reading. When delegating to a helper, give it `mm3 agent delegate`, and check its reported
run ids against the ledger with `mm3 view MM3-####`.

## Change log (this file)

- **2026-11-22.** First version: rules, update workflow, accepted items.
- **2026-11-23.** Hosting moved to the `signal-below` container; nginx caching, gzip, fonts added.
- **2026-11-24.** Consolidated: the pipeline, expected warnings and docker commands now live only
  in `UPDATE-INSTRUCTION.md`; this file keeps rules and hosting facts. Added the one-pass rule and
  the no-key-strings-in-docs rule (both cost extra scan reports today). Fixed the stale
  `allowedHosts` wording (the live site is nginx now).

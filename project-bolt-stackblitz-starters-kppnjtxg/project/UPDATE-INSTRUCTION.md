# UPDATE-INSTRUCTION

How a new zip from the laptop gets onto the live site. This file and `docs/` are Corey's; the rest
of this folder is the son's and is never edited (rules in `CLAUDE.md` at the repo root).

Scan status: scanned 2026-11-22, re-scanned 2026-11-24. No indicators found by these checks in the
zip or in the contained install. A static scan cannot rule out plain-looking malicious code, a
compromised but correctly signed package, or what native binaries do; see "Residual risk" in any
report under `reports/`.

## The pipeline (one pass, one scan)

What usually changes between his zips is the game source (`src/App.tsx`,
`src/components/BuriedComplexGame.tsx`, `src/lib/deep-signal-*.ts`, sometimes a new file in
`src/lib/`). `package.json`, the lockfile and `vite.config.ts` rarely change. His start-up notes
come back in `.npmrc` every time.

The whole flow is two commands: `scan/update-check.sh` before the deploy and
`scan/update-check.sh --post` after it. Everything between them is the steps below.

1. **Stage.** Put the zip at the repo root. Do not unzip it into the repo, and do not run or install
   anything. Never overwrite the live project directly.
2. **Scan and read the bottom line: `scan/update-check.sh`.** Finish any doc edits first. It runs
   `./security-scan.sh` once (the scanner unzips root zips to scratch by itself) and prints only:
   the verdict and report path, any FAIL, any WARN that is not in "Expected scan warnings" below,
   and the files the newest zip changes. It flags a change to `package.json`, the lockfile,
   `vite.config.ts`, `index.html`, `.replit` or scripts.
   - **FAIL:** stop. Tell Corey what fired and where. Do not install or launch.
   - **"OK to continue":** only expected warnings and only game source changed. Go on.
   - **New warning, or a flagged sensitive file:** read that file's diff and tell Corey before going on.
   - If the expected-warning list changes, change `EXPECTED` at the top of the script and the list below together.
   - Keep only the newest report per day: delete that day's earlier ones in `reports/`.
4. **Overlay.** Copy his changed files from the unzipped tree into
   `project-bolt-stackblitz-starters-kppnjtxg/project/`. Then put `.npmrc` back to exactly these two
   lines (Corey approved this on 2026-11-22; first check that the zip's `.npmrc` text is also in
   `.npmrc.txt`, and leave `.npmrc.txt` alone):
   ```
   ; Intentionally empty. npm reads this file, so no notes go here.
   ; The start-up notes live in .npmrc.txt.
   ```
   If the zip's `.npmrc` has real settings (`registry=`, `_authToken`, `ignore-scripts=false`),
   that is a finding: do not overwrite it, ask Corey.
5. **Install in containment.** `scan/contained-install.sh` (runs `npm ci --ignore-scripts` in
   Docker, then re-scans the installed `node_modules`). Never install on the host. Never reuse the
   old `node_modules`.
6. **Staging build** on a spare port (does not touch the live site):
   ```
   cd project-bolt-stackblitz-starters-kppnjtxg/project
   docker build -f ../../deploy/Dockerfile --build-context deploy=../../deploy -t signal-below:next .
   docker run -d --name signal-below-stage -p 127.0.0.1:5175:8080 --read-only --tmpfs /tmp \
     --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
   ```
   Open `http://127.0.0.1:5175`, play a run, then `docker rm -f signal-below-stage`.
7. **Swap** (ask Corey first; a few seconds of downtime). Keep the old image as `signal-below:prev`:
   ```
   docker tag signal-below:new signal-below:prev
   docker rm -f signal-below
   docker run -d --name signal-below --restart unless-stopped -p 5173:8080 --read-only --tmpfs /tmp \
     --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
   docker tag signal-below:next signal-below:new
   ```
   The live container must publish on all interfaces (`-p 5173:8080`), never `127.0.0.1` only.
8. **Check and pre-warm.** Request the new `/assets/index-*.js` and `/assets/index-*.css` once
   through the public URL (so the first friend does not get a cold load), then run
   `scan/update-check.sh --post`. It confirms the container is running and locked down, is on
   `0.0.0.0:5173`, is the `signal-below:new` image, has a `signal-below:prev` to roll back to, has no
   leftover staging container, has the old `signal-web.service` off, that `/` and `/docs/` return 200,
   that the public site serves the same build as the container, and that Cloudflare answers `HIT`.
9. **Rollback** if anything looks wrong: `docker rm -f signal-below`, then the step-7 `docker run`
   with `signal-below:prev`.
10. **Record.** Keep the report. Tell Corey the verdict in plain language with the report path, and
    add a line to the change log below.

## Expected scan warnings (accepted; a MEDIUM verdict with only these is normal)

Each has been read and is not a problem by itself. Only a new kind of warning, or a change in
*what* is flagged, needs a fresh look.

- **[13] Installed `node_modules` does not match the lockfile.** The old install on disk is stale.
  Never reuse it; step 5 rebuilds it. Everything the scan audits is the lockfile, not that folder.
- **[11] Registry metadata.** Packages published less than 14 days ago are normal for a fresh install
  (rollup, babel, postcss, browserslist and similar); the lockfile pins them with integrity hashes
  and registry signatures verify. `graceful-fs` and `@jridgewell/resolve-uri` are flagged "dormant,
  then updated" (noted 2026-11-24: common packages, signatures valid, no sign of tampering, not
  proven). `recharts@2.15.4` is deprecated: an "upgrade sometime" note, not a risk.
- **[18] `deploy/Dockerfile` listed as an automation script.** Ours, expected.
- **[16] `signal.gamelab.link` missing from `allowedHosts`, plus `--host` exposure.** Only matters
  for `vite --host` on a laptop. The live site is nginx and does not use it.
- **[7e] `innerHTML` with variables.** In our guide pages in `docs/` and the vendored shadcn
  components. Not in his game code.
- **[9] npm audit:** 2 moderate findings in `postcss-selector-parser` via `@tailwindcss/typography`.
  Build-time only, on his own CSS. Do not run `npm audit fix --force`.
- **`lucide-react: "latest"`** is unpinned in `package.json`. The lockfile pins it; always `npm ci`.
- **`esbuild` and `fsevents` install scripts** are expected (and skipped by `--ignore-scripts`).
- **The scanner's own test strings.** `security-scan.sh` and `scan/selftest.sh` hold fake keys on
  purpose; the git-history check [23] skips those two files (fixed 2026-11-24 after a false FAIL).
  Never type a key-shaped string into a doc; check [2] reads our docs too.

## Running the game on a laptop (not on the server)

The server never runs `npm run dev`; it serves a finished build (see "How the game is hosted" in
`CLAUDE.md`). On his laptop: `cd project-bolt*/project && npm run dev`; if it says `vite: not
found`, install first, preferably `npm ci --ignore-scripts`, which installs exactly what the
lockfile says. The start-up notes are in `.npmrc.txt` (a note file; npm ignores it).

- `npm run dev` uses `vite --host`, so other devices on the network can open the game. Fine at
  home, avoid on public wifi.
- The `artifacts/api-server` and `lib/db` folders are leftovers from a Replit template. They are
  not used by the game. Do not start the api-server.
- If the game breaks after a Vite version change, that is a "fix the app" question for him, not a
  security question.

## Still waiting for Corey's OK (Cloudflare account changes)

- Turn on **Cloudflare Fonts** (useful now that the font link is in the page).
- Add a **Cache Rule for `/docs/*` only**, 5-minute cache. Never for the game page.
- Turn on **0-RTT** (small speedup for returning friends).
- Optional: host the two fonts ourselves (about 150 KB from Google) to drop the third-party hop.

## Safety notes

- The container is locked down (non-root, read-only files, no extra permissions, 256 MB limit),
  but it can still reach the internet and the LAN, and the build step (which runs his
  `vite.config.ts`) uses ordinary Docker isolation. The scan before building is the main guard.
- A Cloudflare tunnel token was visible in a process list on 2026-11-23. Rotating it in the
  Cloudflare dashboard is a good idea sometime.

## Change log

- **2026-11-22.** Security scan added (`security-scan.sh`, `scan/`). `.npmrc` replaced with the two
  comment lines. Vite version changes noted as normal.
- **2026-11-23.** Hosting moved from `vite preview` on the server to the `signal-below` container.
  A first swap bound it to `127.0.0.1` and the site returned 502 for about a minute; fixed by
  binding on all addresses. nginx now compresses text, caches hashed files for a year, marks pages
  `no-cache`, returns real 404s; fonts link added to the built page. Guides updated ("Think like a
  hacker" section in `docs/hacker-journey.html`, text fix in `docs/field-manual.html`);
  `GAME_SPEEDUP.md` written for him.
- **2026-11-24.** New zip `stackblitz-starters-gg5payac-11-24.zip`. Report
  `reports/security-report-2026-11-24-1220.md`: 0 FAIL, no indicators found by these checks in the
  zip or the contained install. Changed: `src/App.tsx`, `src/components/BuriedComplexGame.tsx`,
  `src/lib/deep-signal-engine.ts`, new `src/lib/Pixel-skins.ts`. `package.json`, lockfile and
  `vite.config.ts` unchanged. `.npmrc` kept as the two comment lines. The update took four reports:
  the git-history check [23] false-failed on the scanner's own fake test keys (fixed in
  `security-scan.sh`), and a fake key typed into a note tripped check [2]. Docs consolidated: this
  file now holds the one pipeline, the expected-warnings list and the commands; `CLAUDE.md` holds
  rules and hosting facts.
- **2026-11-24 (later).** Added `scan/update-check.sh` (before deploy) and `scan/update-check.sh --post`
  (after deploy). It runs the existing scanner and shows only the verdict, new warnings and the files
  the zip changes, then checks the live container and public site. Reports for the day consolidated to
  the last one.

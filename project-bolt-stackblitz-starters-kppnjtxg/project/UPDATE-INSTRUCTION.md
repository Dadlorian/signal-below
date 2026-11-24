# UPDATE-INSTRUCTION

How a new zip from the laptop gets onto the live site. This file and `docs/` are Corey's; the rest
of this folder is the son's and is never edited (rules in `CLAUDE.md` at the repo root).

**To process a zip, run `/scan-new-zip <zipname>`** (`.claude/commands/scan-new-zip.md`). It holds the
steps: scan the zip first (nothing run or installed), read the one report, review anything new,
overlay his files, install in containment, staging build, report, and stop for Corey before the swap.
The one scanner is `./security-scan.sh`. What we already trust lives in `scan/allowlist.txt` (the
registry): known items are quiet, a new package, host, script or file type is loud. The scan's
verdict means "no indicators found by these checks"; it cannot rule out plain-looking malicious code,
a compromised but correctly signed package, or what native binaries do (see "Residual risk" in any report).

## Things the commands refer to

**`.npmrc`.** His start-up notes come back in it every time. If its text is also in `.npmrc.txt` and
it has no `registry=`, `_authToken`, `ignore-scripts` or `strict-ssl`, replace it with exactly these
two lines (Corey approved this 2026-11-22; leave `.npmrc.txt` alone). Real settings are a finding: ask Corey.
```
; Intentionally empty. npm reads this file, so no notes go here.
; The start-up notes live in .npmrc.txt.
```

**Staging build** (does not touch the live site):
```
cd project-bolt-stackblitz-starters-kppnjtxg/project
docker build -f ../../deploy/Dockerfile --build-context deploy=../../deploy -t signal-below:next .
docker run -d --name signal-below-stage -p 127.0.0.1:5175:8080 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
```
Open `http://127.0.0.1:5175`, play a run, then `docker rm -f signal-below-stage`.

**Swap** (only after Corey says go; a few seconds of downtime). Keep the old image as `signal-below:prev`:
```
docker tag signal-below:new signal-below:prev
docker rm -f signal-below
docker run -d --name signal-below --restart unless-stopped -p 5173:8080 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
docker tag signal-below:next signal-below:new
```
It must publish on all interfaces (`-p 5173:8080`), never `127.0.0.1` only: the tunnel reaches the
container on the LAN address. Then request the new `/assets/index-*.js` and `.css` once through
`https://signal.gamelab.link` (pre-warm) and run `deploy/verify-live.sh`.

**Rollback:** `docker rm -f signal-below`, then the same `docker run` with `signal-below:prev`.

## Quiet by design, and the two that are not in the registry

Known items sit in `scan/allowlist.txt` with a reason and date. Two standing warnings are not
registry items: **[13]** the old `node_modules` on disk is stale (never reuse it; the contained
install rebuilds it) and **[16]** `signal.gamelab.link` is not in `allowedHosts`, which only matters
for `vite --host` on a laptop (the live site is nginx). Also expected: `lucide-react: "latest"` (the
lockfile pins it, always `npm ci`), the 2 moderate `npm audit` findings in
`postcss-selector-parser` via `@tailwindcss/typography` (build-time only; never `npm audit fix --force`).
The scanner's own fake test keys live in `security-scan.sh` and `scan/selftest.sh`; never type a
key-shaped string into any doc, because check [2] reads them too.

## Running the game on a laptop (not on the server)

The server never runs `npm run dev`; it serves a finished build. On his laptop:
`cd project-bolt*/project && npm run dev`; if it says `vite: not found`, install first, preferably
`npm ci --ignore-scripts`. `npm run dev` uses `vite --host`, so other devices on the network can open
the game: fine at home, avoid on public wifi. `artifacts/api-server` and `lib/db` are Replit
leftovers; do not start them. A game that breaks after a Vite version change is a "fix the app"
question for him, not a security question.

## Still waiting for Corey's OK (Cloudflare account changes)

- Turn on **Cloudflare Fonts**, add a **Cache Rule for `/docs/*` only** (5 minutes, never the game
  page), turn on **0-RTT**. Optional: host the two fonts ourselves (about 150 KB).
- A tunnel token was visible in a process list on 2026-11-23; rotating it in the Cloudflare dashboard
  is a good idea sometime.

## Change log

- **2026-11-22.** Scanner added; `.npmrc` replaced with the two comment lines.
- **2026-11-23.** Hosting moved to the `signal-below` container (nginx). Caching, gzip, real 404s, early fonts link.
- **2026-11-24.** His v3.0 zip applied (`App.tsx`, `BuriedComplexGame.tsx`, `deep-signal-engine.ts`, new
  `Pixel-skins.ts`; package files and `vite.config.ts` unchanged). Report
  `reports/security-report-2026-11-24-1257.md`, 0 FAIL. Process consolidated: one scanner, the registry, one
  slash command, one report per day. `scan/update-check.sh` removed; its deploy check is `deploy/verify-live.sh`.
  Check [11] now warns only on packages new or changed since the last committed lockfile. The zip scan now
  also reports eval/Function/child_process hits (`--warn-too`), so they are seen before his files are overlaid.

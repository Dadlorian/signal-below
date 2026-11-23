# UPDATE-INSTRUCTION

Security check of this project before install or launch. Scanned 2026-11-22.
No code was changed. This file is the only thing added.

## Result: safe to install and run

- No install-time scripts in `package.json` (no preinstall, install or postinstall).
- Every package in `package-lock.json` comes from the official npm registry.
- No hidden or obfuscated code, no `eval`, no shell commands, no hardcoded passwords or keys.
- The game only talks to Google Fonts. Saves stay in the browser (`localStorage`).
- `npm audit`: 2 moderate findings, both in the `@tailwindcss/typography` build tool. This is low risk, because it only affects building your own CSS. Do NOT run `npm audit fix --force`.

## How to start it

These commands are for running the game **on a laptop**. The server no longer runs
`npm run dev`. It serves a finished build from a Docker container (see "How the game is hosted"
below).

The start notes are in `.npmrc.txt` (a note to remember how to start it). Use these:

```
cd project-bolt*/project && npm run dev
```

Only if it says `vite: not found`:

```
cd project-bolt*/project && npm install && npm run dev
```

Safer install (installs exactly what the lockfile says):

```
npm ci --ignore-scripts
npm run dev
```

## About the note files

- `.npmrc.txt` is only a note. npm ignores it. It is fine as it is.
- `.npmrc` is read by npm, so notes pasted there cause "Unknown project config" warnings.
  On 2026-11-22 it was replaced with two comment lines (no settings, no warnings). The old
  text was identical to `.npmrc.txt`, so nothing was lost.
- Each new zip from the laptop brings the note back in `.npmrc`. After unzipping, put the
  two comment lines back (see CLAUDE.md) and keep the notes in `.npmrc.txt`.

## Vite and tool version changes are not a security problem

His updates often bump or downgrade Vite and its plugins (for example Vite 8 to 6). That is
normal and not a risk by itself. What matters is the result of the scan, not the version number.
After a version change the old `node_modules` is out of date, so rebuild it with `npm ci`
(in the container) and never reuse the old one. If the game breaks after a version change,
that's a "fix the app" question for him, not a security question.

## Things to know (not problems)

- `npm run dev` uses `vite --host`, so other devices on your network can open the game.
  That is fine at home. Avoid it on public wifi.
- `lucide-react` is set to `"latest"` in `package.json`. The lockfile pins the real version,
  so use `npm ci` to stay on the checked version.
- The `artifacts/api-server` and `lib/db` folders are leftovers from a Replit template.
  They are not used by the game. Do not start the api-server without a review.

## How the game is hosted (since 2026-11-23)

- The live site is a Docker container named `signal-below`. It holds only the **finished** game
  files, served by nginx. There is no Node and no `node_modules` in it, so none of his package code
  runs on the server.
- It listens on port 5173. A Cloudflare tunnel sends `signal.gamelab.link` to it.
  The container must listen on **all** network addresses (`-p 5173:8080`). The tunnel connects to the
  server's LAN address, so a `127.0.0.1`-only setting makes the site return 502.
- The old `signal-web.service` is **stopped and disabled**. It ran `vite build` on the server at every
  start, which is exactly what we avoid. Do not turn it back on.
- Everything for hosting lives in the `deploy/` folder at the top of the repo. His code is never edited.
- The container restarts by itself if it stops (`--restart unless-stopped`).
  A manual restart is `docker restart signal-below`.

### What the hosting does for his frequent updates
- **Game files** (`/assets/...`) have a hash in the name that changes whenever the code changes.
  They are cached for a year, and a new build means new names, so updates show up right away.
- **The game page and the guides** are sent as `no-cache`, so friends' browsers check for a new
  version every time and get it right after an update.
- **Text is compressed** on the way through the tunnel (the JS went from 357 KB to 111 KB).
- **Unknown paths** such as `/api/...` return a real 404. `/favicon.ico` returns "nothing here" (204).
  The game's own pages (like `/play/deep-signal`) still work.
- **Fonts start early.** After the build, `deploy/inject-fonts.js` copies the Google Fonts address from
  his `src/index.css` into the built page, so fonts load while the page loads. If his CSS changes, it
  skips quietly. His source files are never changed.
- **Cloudflare pre-warm.** After each update we load the new game files once through the public
  address, so the first friend does not get a slow, cold load (the old "glitch").

### Publishing an update (after the security scan passes)
1. Unzip his new version into a scratch folder. Run `./security-scan.sh`. Do not install or launch on
   the server until it passes (see the top of this file).
2. Put his files in `project-bolt-.../project/`, then fix `.npmrc` (see "About the note files").
3. Build and test on a spare port first (this does not touch the live site):
   ```
   cd project-bolt-stackblitz-starters-kppnjtxg/project
   docker build -f ../../deploy/Dockerfile --build-context deploy=../../deploy -t signal-below:next .
   docker run -d --name signal-below-stage -p 127.0.0.1:5175:8080 --read-only --tmpfs /tmp \
     --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
   ```
   Open `http://127.0.0.1:5175`, play a run, then `docker rm -f signal-below-stage`.
4. Ask Corey, then swap (a few seconds of downtime). Keep the old image as `signal-below:prev` so a
   rollback is one command:
   ```
   docker tag signal-below:new signal-below:prev
   docker rm -f signal-below
   docker run -d --name signal-below --restart unless-stopped -p 5173:8080 --read-only --tmpfs /tmp \
     --cap-drop ALL --security-opt no-new-privileges --pids-limit 100 --memory 256m --user 101 signal-below:next
   docker tag signal-below:next signal-below:new
   ```
5. Check `https://signal.gamelab.link/`, `/docs/`, and a game page all return 200. Then pre-warm: load
   the new `/assets/index-*.js` and `.css` once through the public address and expect `cf-cache-status: HIT`.
6. Rollback if anything looks wrong: remove `signal-below`, then run `signal-below:prev` with the same
   `docker run` options.

### Still waiting for Corey's OK (Cloudflare account changes)
- Turn on **Cloudflare Fonts** (now useful because the font link is in the page).
- Add a **Cache Rule for `/docs/*` only**, 5-minute cache. Never for the game page.
- Turn on **0-RTT** (small speedup for returning friends).
- Optional: host the two fonts ourselves (about 150 KB from Google) to drop the third-party hop.

### Safety notes
- The container is locked down (non-root, read-only files, no extra permissions, 256 MB limit), but it can
  still reach the internet and the LAN, and the build step (which runs his `vite.config.ts`) uses ordinary
  Docker isolation. The security scan before building is the main guard. See the containment discussion in
  `CLAUDE.md`.
- A Cloudflare tunnel token was visible in a process list on 2026-11-23. Rotating it in the Cloudflare
  dashboard is a good idea sometime.

## Change log
- **2026-11-22.** Security scan added (`security-scan.sh`, `scan/`). `.npmrc` replaced with comment lines.
  Vite version changes noted as normal.
- **2026-11-23.** Hosting moved from `vite preview` on the server to the Docker container above. A first
  swap bound the container to `127.0.0.1` and the site returned 502 for about a minute. It was fixed by
  binding on all addresses.
- **2026-11-23.** Guides updated: new "Think like a hacker" bonus section in `docs/hacker-journey.html`
  (clean, highlighted, beginner-friendly), and a wrapped-text fix in `docs/field-manual.html`.
  `GAME_SPEEDUP.md` written for him.
- **2026-11-23.** nginx now compresses text, caches hashed game files for a year, marks pages `no-cache`,
  and returns real 404s. Fonts link added to the built page. Container restarted and re-checked.

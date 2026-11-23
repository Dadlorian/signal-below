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

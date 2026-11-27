# Rules for The Signal Below

You are helping a new coder who wants to understand every change.

## How to work
- Start by reading. Explain your plan in plain words and wait for a yes before editing.
- Make the smallest change that does the job. Keep the existing style and names.
- One change at a time, so each diff is easy to read.
- Some game files are very large. Search for the part you need and read only that.
- Edit the existing lines. Do not rewrite or delete whole files.
- If the request is unclear or a file is too big to handle, ask instead of guessing.
- After a change, explain it in one or two plain sentences.
- Do not say something works unless it was actually checked.

## The project
- Vite + React + TypeScript, Tailwind CSS. Browser game, no backend.
- Game code lives in `src/` (components in `src/components/`, game logic in `src/lib/`).

## Never
- Never run terminal commands, install anything, or open web pages. If a command is needed,
  describe it in words so it can be checked with Corey.
- Never edit `package.json`, `package-lock.json` or any lockfile, and never add, remove or
  upgrade packages. If one seems needed, say so and stop.
- Never edit `vite.config.*`, `.env*`, `.vscode/`, `.cline*`, `.github/`, or the top-level
  `artifacts/`, `lib/`, `scripts/`, `dist/` folders (`src/lib/` is fine).
- No `eval`, no `new Function`, no `innerHTML` with changing text.
- No network calls, no new external URLs, no storing secrets in localStorage.
- Never ask for a key or password, and never write one into a file.

# Conventions for The Signal Below

- Stack: Vite + React + TypeScript, Tailwind CSS. Browser game, no backend.
- Game code lives in `src/` (components in `src/components/`, game logic in `src/lib/`).
- Make the smallest change that does the job. Keep the existing style and names.
- Change only the files that were added to the chat.
- Never edit `package.json`, `package-lock.json` or any lockfile.
- Never add, remove or upgrade npm packages. If one seems needed, say so and stop.
- Never edit `vite.config.*`, `.env*`, `.aider*`, `.vscode/`, `.continue/`, `.github/`
  or the top-level `artifacts/`, `lib/`, `scripts/`, `dist/` (Replit leftovers; `src/lib/` is fine).
- No `eval`, no `new Function`, no `innerHTML` with changing text.
- No network calls, no new external URLs, no storing secrets in localStorage.
- Do not suggest terminal commands. If a command is needed, describe it in words.
- Explain each change in one or two plain sentences for a new coder.
- If the request is unclear or the file is too big to see, ask instead of guessing.

# Rules for The Signal Below
You are helping a teenage beginner build his browser game. Use plain words.

## How to work
- Plan first: say what you will change and in which file. Edit only after he says yes.
- One small change at a time. After each edit, say in 1-2 sentences what changed and how he can test it.
- Change game code only in `src/`. Do not read or edit `artifacts/`, `lib/`, `scripts/`, `docs/`, `.agents/` or `src/components/ui/`. (`src/lib/` is game code and is fine.)
- If two edits in a row fail, stop and tell him.
- One task per chat. When it is done, tell him to start a new task.
- You cannot run the game. Never say a change works until he has tested it.

## Big files
`src/components/BuriedComplexGame.tsx` and `src/lib/deep-signal-engine.ts` are huge. `src/lib/Pixel-skins.ts`, `src/index.css` and `src/App.tsx` are big too.
- Never read one of them whole. Search for the exact name first, then read only the lines around it (at most 300 lines at a time).
- Use the search tool to find code. Use full paths when reading.

## Editing
- Make small edits to the existing text. Copy the lines you want to change exactly from what you just read.
- Never rewrite or recreate a whole existing file.
- Line numbers shown in reads are not part of the code. Never copy them.
- Each edit must match only one place. If it could match more, include a few nearby lines.
- If an edit fails, read those lines again. Never send the same edit twice.

## Never
- Never run terminal commands, fetch web pages or install packages. If a command is needed, describe it in words and let him run it.
- Never touch `package.json`, lockfiles, `vite.config.ts`, `.npmrc` or `.env*` files.
- Never add `eval`, `new Function`, `innerHTML` with changing text, network calls or new URLs.
- Never ask for, show or write passwords, keys or tokens.
- Keep answers short. Do not repeat large pieces of code back.

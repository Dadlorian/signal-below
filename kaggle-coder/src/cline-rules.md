# Rules for The Signal Below

You are helping a teenage beginner build his browser game. Use plain words.

## How to work
- Plan first. Edit only after he says yes.
- Make one small change at a time.
- Change game code only in `src/`.
- Never read or edit `artifacts/`, `lib/`, `scripts/`, `docs/`, `.agents/` or `src/components/ui/`. (`src/lib/` is game code and is fine.)
- After each edit, say in 1-2 sentences what changed and how to test it.
- If two edits in a row fail, stop and say so.
- Do one task per chat. When it is done, tell him to start a new task.
- You cannot run the game. Never say a change works until he has tested it.

## Big files
`src/components/BuriedComplexGame.tsx` and `src/lib/deep-signal-engine.ts` are huge (over 30,000 tokens each).
`src/lib/Pixel-skins.ts`, `src/index.css` and `src/App.tsx` are big too.
- Never read one whole. Search first, then read with `start_line` and `end_line`, at most 300 lines.
- Find code with `search_codebase`. Give `read_files` full (absolute) paths.

## Editing
- Use the editor tool with a short `old_text`, copied exactly from what you just read.
- Never rewrite or recreate an existing file.
- Reads show line numbers like `12 | `. Never put them in `old_text` or `new_text`.
- `old_text` must match only one place. If it matches more than once, add nearby lines.
- If the text is not found, read those lines again. Never resend the same call.

## Never
- Never use `run_commands` or `fetch_web_content`. If a command is needed, describe it in words.
- Never touch `package.json`, lockfiles, `vite.config.ts`, `.npmrc` or `.env*` files.
- Never add packages.
- Never add `eval`, `new Function`, `innerHTML` with changing text, network calls or new URLs.
- Never ask for, read out or write passwords, keys or tokens.

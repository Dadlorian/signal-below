# THE LOOP 🔁

**IDEA > DESIGN > CODE > TEST > PUSH.** Five steps, five commands, one branch per idea.
Every command prints the real `git` / `npm` command before it runs it. Watch them: after a few
loops you won't need `loop` at all. **That's the point.**

Nothing here has been tested yet. Lines marked [test this first] are unconfirmed.

| Step | Type this | What it does | What a hacker learns here |
|---|---|---|---|
| **[1/5 IDEA]** | `loop idea boss-flash` | `git switch main`, `git pull --ff-only`, new branch `v-boss-flash`, plan note `ideas\boss-flash.md` (what / why / which file / how I'll test / what could break) | One idea = one branch. `main` stays clean, always. |
| **[2/5 DESIGN]** | `loop design` | Starts the helper in **ask-only** mode (`--chat-mode ask`): it answers, it cannot edit. Write the plan into your note. | Think before you type. Pros plan on paper first. |
| **[3/5 CODE]** | `loop code` | Starts the helper in plan-then-ask mode: it shows a plan, asks **"Edit the files?"**, and writes only after you say y. Every edit = one commit. | Read every diff (`/diff`). `/undo` exists. |
| **[4/5 TEST]** | `loop test` | Rule 1 check (did the package list change?), Rule 2 check (`eval` / `new Function` / `innerHTML`), `npm run build`, then a preview on **your computer only**: http://127.0.0.1:4173 | A build that passes is not a game that works. Play it. |
| **[5/5 PUSH]** | `loop push` | Refuses on `main` or if a key file / key name / tunnel address is in your changes. Shows what changed, asks y/n, commits, `git push -u origin v-...`, prints your pull-request link. | Ship small. A pull request is a conversation, not a test you pass or fail. |

Extras: `loop setup` (first time: `npm ci --ignore-scripts` from the lockfile only), `loop status`
(where am I? `[x] IDEA [x] DESIGN [ ] CODE ...`), `loop undo` (take back the helper's last commit
with `git revert`, which still works after a push), `loop help`.

Today's address from your Kaggle notebook goes after `design` / `code`, or once per window:
`set KC_URL=https://...` (cmd) or `$env:KC_URL="https://..."` (PowerShell).

> [!WARNING]
> **Why not `npm run dev`?** The game's `dev` script runs Vite with the `--host` flag: it shares
> your dev server with **every device on the network**. `loop test` runs Vite's `preview` on `127.0.0.1` instead:
> only your own computer can see it. Vite's docs say preview follows `server.host`, which
> defaults to localhost; `loop` also says 127.0.0.1 out loud [test this first].

> [!CAUTION]
> **The helper is a suggestion machine.** `loop` never runs a command the AI suggested. If the
> helper says "run this", write it down and ask Corey. Never type `/run`, `/test`, `/lint`,
> `/web`, `/code` or `!` inside the helper.

## What happens after PUSH (Corey's part)

```text
PUSH  >  CHECKS  >  SCAN  >  SEALED BOX  >  TEST COPY  >  LIVE  >  UNDO BUTTON
```

- **CHECKS:** GitHub looks at your pull request: keys, tunnel addresses, packages, Rule 2, and a
  build. **RED CHECK = a clue, not a punishment.**
- **SCAN:** Corey reads your code and scans it without running it.
- **SEALED BOX:** Docker builds and serves your game. Not his server.
- **TEST COPY:** a staging copy on Corey's server, only he can open it. He plays a run.
- **LIVE:** after Corey says go, friends get it.
- **UNDO:** the last version stays ready. One command puts it back.

You can't merge. Corey merges. **This is the Way.**

## Stuck? 🧭

| You see | Do |
|---|---|
| `You have unsaved work` | `loop status` to see it. Finish with `loop push`, or ask Corey about `git stash`. |
| `You are on main` | `loop idea <name>` first. |
| `First time? Run loop setup` | `loop setup` |
| Build failed | Read the **first** red line. Ask the helper (`loop design`) what it means. |
| `STOP: ...` anything | Stop. Don't delete files to make it go away. Ask Corey. |
| Merge conflict, weird git message | Don't force anything. Copy the message, ask Corey. Everyone hits these. |

## "I only downloaded the zip"

A zip is a photo of the code: no history, no branches, can't push. Get the real thing:

1. Install **Git for Windows** (normal installer, your own account).
2. `git clone https://github.com/<owner>/<repo>.git signal` then `cd signal`
3. **Already changed files in your zip copy?** Copy **only the files you changed** into the
   clone (never `node_modules`, never `.env`), then `loop idea my-zip-changes` and
   `loop push`. Corey sees exactly what changed.

## Friends 🎮

- Corey adds you as a **collaborator** on GitHub (you need your own account, 13+).
- You can push **branches**. `main` is protected: you can't push to it and you can't merge.
- Same loop, same rules, same card. Your pull request gets the same checks and review.

## In the editor (VSCodium)

- **Terminal:** View > Terminal, then any `loop` command. Works the same. No extensions needed,
  and the editor is set to refuse them.
- **Run Task menu (optional):** Corey can add user tasks so Ctrl+Shift+P > *Tasks: Run Task*
  shows `1-IDEA` ... `5-PUSH` (`vscodium/user-tasks.json`) [test this first].
- **Comment mode (optional, off by default):** Aider's `--watch-files` reacts to one-line
  comments that end in `AI!` (change this) or `AI?` (question). It reacts in **any** file that
  changes, including files you just pulled from someone else's branch. So: only with Corey's OK,
  Corey starts it with every start-helper safety switch plus `--watch-files` (never plain
  `aider --watch-files`), only after `git pull` has finished, and never left running while you
  pull [test this first]. `loop` and `start-helper` never turn it on.

None of the editor extras has been tested yet. Until Corey tries them, the terminal is the way.

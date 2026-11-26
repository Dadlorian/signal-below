# kaggle-coder: your coding lab

**Build The Signal Below with an AI teammate. Free tools. Your laptop. Your code.**

A big AI model runs on a free Kaggle computer and helps you write code. You stay in charge: it
suggests, **you** read, **you** decide. You send your work to GitHub, Corey checks it, and then
your friends can play it.

## The 5-step loop

```text
 1 IDEA  >  2 DESIGN  >  3 CODE  >  4 TEST  >  5 PUSH
```

| Step | You type | What happens |
|---|---|---|
| 1. **IDEA** | `loop idea boss-flash` | Makes your own branch and a tiny plan note |
| 2. **DESIGN** | `loop design` | Ask the helper how to do it. It can only answer, not change anything |
| 3. **CODE** | `loop code` | Change one small thing. The helper asks before it writes |
| 4. **TEST** | `loop test` | Builds the game, runs the checks, lets you play it |
| 5. **PUSH** | `loop push` | Sends your branch to GitHub for Corey to review |

Then Corey's pipeline takes over: scan, sealed box, test copy, live, undo button.
One page with all of it: [loop/LOOP.md](loop/LOOP.md).

## Start here

| I want to... | Read |
|---|---|
| Set up my laptop (no admin password needed) | [SETUP-NO-ADMIN.md](SETUP-NO-ADMIN.md) |
| Learn the daily loop | [loop/LOOP.md](loop/LOOP.md) |
| Connect to the coding helper | [GUIDE-WINDOWS.md](GUIDE-WINDOWS.md) |
| See what protects us from mistakes and tricks | [SAFETY-BRIDGE.md](SAFETY-BRIDGE.md) |

## Three rules

1. **Read before you say yes.** The helper can be wrong or get tricked. Read every change. Say no
   if you do not understand it. Never run something just because the helper (or a stranger) said so.
2. **Keys are secrets.** The helper has a password-key. Never put it in your game folder, GitHub,
   a chat, a screenshot or a note. If it leaks, tell Corey right away. That is not a punishment;
   we just change the key.
3. **Ask Corey first** for: a new package, anything you download, a zip, or any command you do not
   understand. A good hacker checks before they run.

## What is under the hood

Your laptop talks to a model on Kaggle through a temporary web address that changes every
session. It only answers when you send the key. Your code goes to GitHub as a pull request, and
checks run on it before Corey approves.

## For Corey (the grown-up docs)

**Status: nothing here has been run or tested yet.** Lines marked **[test this first]** are
unconfirmed. Passing every check means "no indicators found by these checks", not "harmless".
What the checks cannot rule out is at the end of SAFETY-BRIDGE.md.

| File | What it is |
|---|---|
| [TEST-CLINE.md](TEST-CLINE.md) | Your test of VS Code + Cline against the Kaggle server |
| [GUIDE-COREY-UBUNTU.md](GUIDE-COREY-UBUNTU.md) | Key, GitHub setup, review routine, first run on your own Kaggle account |
| `kaggle/server.py`, `kaggle/PINS.md` | The server script for a private Kaggle notebook, and every pinned version and hash |
| `aider/` | Settings and launcher for the Aider terminal helper (the other one under test) |
| `loop/` | `loop.cmd` and its one-page guide |
| `github/` | Pull-request checks (`safety.yml`, or the superset `loop-check.yml`), gitleaks rules, CODEOWNERS |
| `vscodium/` | Plain-editor settings; optional Run Task menu |
| `tests/smoke.sh` | Checks a new Kaggle address, including whether streaming works through the tunnel |
| `continue/` | Parked, not in use |

Everything used is free. llama.cpp, cloudflared, the Qwen models, Cline, Aider, uv and gitleaks
are open source. Kaggle, Cloudflare and GitHub are free services, not open source.

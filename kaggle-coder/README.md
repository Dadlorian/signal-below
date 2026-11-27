# kaggle-coder: your coding lab

Build **The Signal Below** with an AI teammate. Free tools, your laptop, your code.
A big AI runs on a free Kaggle computer and suggests code. **You** read it and decide.

```text
 DOWNLOAD  >  INSTALL  >  CHECK  >  GIT  >  YOUR BRANCH  >  CODE  >  TEST  >  PUSH
 (once, about 30 minutes)                    (every time: the 5-step loop)
```

## What you will have

| Tool | Why you need it | Free? |
|---|---|---|
| **VS Code** | the editor where you write code | yes |
| **Git** | saves versions of your code, sends it to GitHub | yes |
| **Node.js** | runs the game's build tools | yes |
| **A helper**: Cline (a chat panel in VS Code) or Aider (typed commands) | your AI teammate. Corey picks one | yes |
| **GitHub account** (turn on 2-step login) | where your code lives and gets checked | yes |
| **Kaggle account** (phone-verified) | the free computer the AI runs on | yes |
| **`loop`** (one small file, comes in the zip) | five simple commands for the loop | yes |

## Three rules

1. **Read before you say yes.** The helper can be wrong or get tricked. Read every change. If you
   do not understand it, say no and ask.
2. **Keys are secrets.** Never put the helper's key in your game folder, GitHub, a chat or a
   screenshot. If one leaks, tell Corey. It is not a punishment; we just change the key.
3. **Admin password pop-up? STOP.** Close it and ask Corey. You never need "Run as administrator".
   Also ask Corey before you add a package, or run anything you downloaded.

---

## Part 1: Build your lab (once)

### Step 1. Download the starter zip and check it

1. Corey sends you the link. On GitHub click the green **Code** button, then **Download ZIP**.
2. **Scan it.** Right-click the zip, **Show more options**, **Scan with Microsoft Defender**.
   No antivirus? Use <https://www.virustotal.com>: click **File**, pick the zip. Or look it up
   without uploading: `certutil -hashfile "<the zip>" SHA256` and paste the code in its search box.
3. Right-click, **Extract All**, into `C:\Users\<you>\code\starter`. Do not run anything yet.

*Reading a scan:* nobody flags it = no alarms. A scanner or two you never heard of = ask Corey.
Defender flags it, or lots do = delete it, tell Corey. A clean scan means **no alarms**. It is not
a promise, which is why we only use official sites and read what we run.

### Step 2. Install the tools

Open **Terminal** (Start menu, type Terminal, Enter: a normal click, not "as administrator").
Type each line. `winget` is Microsoft's own installer and is already on Windows 11.

```text
winget install --id Git.Git -e --version 2.56.1 --scope user
winget install --id Microsoft.VisualStudioCode -e --version 1.146.0 --scope user
```

*Why the extra words:* `--version` picks a release that has been out a while. `--scope user`
installs **for your account only** (no admin). winget checks the download against Microsoft's list.
**Never add `--ignore-security-hash`**: that turns the check off. Want to read about a package
first? `winget show --id Git.Git -e`. Prefer the careful way? Download from
<https://git-scm.com/download/win> or <https://code.visualstudio.com/Download> (pick **User
Installer**), scan it, then run it.

**Node.js** has no per-user winget package (it needs admin), so use the zip:

1. Download `node-v26.13.1-win-x64.zip` from <https://nodejs.org/dist/v26.13.1/> and scan it.
2. Check its fingerprint: `certutil -hashfile "$HOME\Downloads\node-v26.13.1-win-x64.zip" SHA256`
   and compare with the same file name in <https://nodejs.org/dist/v26.13.1/SHASUMS256.txt>.
   They must match exactly. If not, delete it and tell Corey.
3. Unzip into your own folder:
   ```text
   mkdir $HOME\tools\bin
   tar -xf $HOME\Downloads\node-v26.13.1-win-x64.zip -C $HOME\tools
   ```
4. Put the `loop` file where you will find it (press Tab to finish the long folder name):
   `copy $HOME\code\starter\<folder>\kaggle-coder\loop\loop.cmd $HOME\tools\bin`

*If Corey says you use Aider:* also `winget install --id astral-sh.uv -e --version 0.13.8`, then
his one `uv tool install` line (it is in `kaggle/PINS.md`).

### Step 3. Tell Windows where your tools are

Windows finds commands by looking in the folders on your **Path**.
Start menu, type **Edit environment variables for your account** (the *account* one, not the
system one), **Path**, **Edit**, **New**, and add both:

```text
C:\Users\<you>\tools\node-v26.13.1-win-x64
C:\Users\<you>\tools\bin
```

OK, OK. *Why this way:* it only changes **your** account. Please do not use `setx PATH`: it can
cut your Path short and mix up settings.

### Step 4. Check it works

**Close the Terminal and open a new one**, then type these. Each must print something.

```text
git --version
node --version
npm.cmd --version
code --version
loop help
```

("Not recognized"? Close and reopen the Terminal, then check Step 3. We type `npm.cmd` because
PowerShell can refuse plain `npm`.) In VS Code, open Settings (`Ctrl+,`), search **telemetry**
and set it to **off**.

---

## Part 2: Connect to GitHub and Kaggle (once)

### Step 5. Tell Git who you are

```text
git config --global user.name "YourName"
git config --global user.email "your-private-github-email"
```

On GitHub: **Settings, Emails**, tick **Keep my email addresses private**, and copy the
`...@users.noreply.github.com` address it shows. Use that one so your real email is never public.
The first time you push, a sign-in window opens (Git for Windows includes it) [test this first].

### Step 6. Get the game

```text
git clone https://github.com/Dadlorian/signal-below.git $HOME\code\signal
cd $HOME\code\signal
loop setup
```

*Why:* `clone` copies the game and remembers where it came from. `loop setup` installs the game's
own packages from its lock file (and runs no install scripts).

### Step 7. Wake up your helper (with Corey the first time)

Make a free Kaggle account, verify your phone, copy Corey's notebook, add the key as a Kaggle
Secret. Steps are in [docs/GUIDE-WINDOWS.md](docs/GUIDE-WINDOWS.md). Each work session: open the
notebook, **Run**, wait for the line with `https://<words>.trycloudflare.com`, copy it. **Stop the
Kaggle session when you finish.** The address is different every time.

---

## Part 3: The loop (every time)

| # | Step | You type | What happens |
|---|---|---|---|
| 1 | **IDEA** | `loop idea boss-flash` | Makes **your own branch** `v-boss-flash` and a tiny plan note |
| 2 | **DESIGN** | `loop design <address>` (Aider) or the Cline panel | Ask how to do it. It only answers |
| 3 | **CODE** | `loop code <address>` (Aider) or the Cline panel | Change one small thing. It asks before it writes |
| 4 | **TEST** | `loop test` | Builds the game, runs checks, opens it at http://127.0.0.1:4173 |
| 5 | **PUSH** | `loop push` | Commits, sends **your branch** to GitHub, prints the pull-request link |

**Then GitHub checks your code by itself.** Once Corey switches it on, every pull request runs
checks: hidden keys, risky packages, `eval` and `innerHTML` tricks, and a test build of the game.
A red check is a clue, not a telling-off. Fix it and push again. When the checks are green and
Corey approves, your branch merges into `main`, and Corey's pipeline puts it live
(scan, sealed box, test copy, live, undo button). You never push straight to `main`.

More on each step: [loop/LOOP.md](loop/LOOP.md).

## Stuck?

| Problem | Try |
|---|---|
| A window asks for an admin password | Stop. Tell Corey. |
| `winget` is not recognized | Tell Corey; Windows may need an update. |
| Defender or SmartScreen blocks a file | Do not click around the warning. Tell Corey which file. |
| School or work laptop blocks downloads | That laptop has its own rules. Tell Corey. |
| "running scripts is disabled" | That rule is for PowerShell script files. `loop` is a `.cmd` file. [test this first] |
| Anything else | Tell Corey exactly what the screen says. That is how we fix this page. |

---

## For Corey

**Status: nothing here has been run or tested yet.** Lines marked **[test this first]** are
unconfirmed. Passing every check means "no indicators found by these checks", not "harmless";
what they cannot rule out is at the end of `docs/SAFETY-BRIDGE.md`.

| Where | What |
|---|---|
| `docs/GUIDE-COREY-UBUNTU.md` | Key, GitHub setup (branch protection, collaborators), review routine, first run on your own Kaggle account |
| `docs/GUIDE-WINDOWS.md` | Connecting the laptop to the helper: Kaggle notebook, key, Aider/Cline files |
| `docs/TEST-CLINE.md` | Your test of VS Code + Cline against the Kaggle server (streaming first) |
| `docs/SAFETY-BRIDGE.md` | Every protection layer, where keys live, the leak routine, the printable "Stop and ask Corey" card |
| `kaggle/` | `server.py` (private Kaggle notebook), `PINS.md` (every pinned version and hash) |
| `github/` | The pull-request checks (`loop-check.yml` or `safety.yml`), gitleaks rules, CODEOWNERS. **Not live** until you copy them into `.github/` |
| `aider/`, `continue/`, `vscodium/` | Aider settings and launcher; Continue (parked); optional editor settings |
| `loop/`, `tests/` | `loop.cmd` and its page; `smoke.sh` for a new Kaggle address |
| `cline/` | Cline side-panel route (untested): VS Code user settings (Copilot off, only Cline allowed) and Cline's rules. Steps in `docs/GUIDE-WINDOWS.md`; test first with `docs/TEST-CLINE.md` |
| `KAGGLE-PLAN.md` | Proposal: each person's own Kaggle account, one command to start (not built) |

**One switch for the GitHub checks:** copy `github/workflows/loop-check.yml` to
`.github/workflows/` in the game repo, and turn on branch protection for `main` (required review,
required checks). Details in `docs/GUIDE-COREY-UBUNTU.md`, part L. Today the game's `dev` script is
`vite --host`, which `safety.yml` fails on every pull request; `loop-check.yml` only fails when a
pull request adds or changes it.

Everything used is free. llama.cpp, cloudflared, the Qwen models, Cline, Aider, uv and gitleaks are
open source. Kaggle, Cloudflare and GitHub are free services, not open source.

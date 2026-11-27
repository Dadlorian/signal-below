# Setting up your coding helper (Windows 11)

You are about to get your own AI coding helper, running on two real GPUs in the cloud, for free,
and you will send your code to GitHub the way professional developers do. Take it one step at a
time; each step fits on one screen. Corey does some steps with you, marked **(with Corey)**.

Nothing here has been tested yet. Corey tries everything on his own accounts first. If a step
does not match what you see, that is not your fault: write down what you saw and tell Corey.
Steps marked [test this first] are unconfirmed.

---

## Step 0. Before you start (Corey)

- Finish GUIDE-COREY-UBUNTU first, including the test on your own Kaggle account (part F).
- He needs his **own** Kaggle account with his own email. If he is 13 to 16, Kaggle's
  parent/guardian consent form comes first: https://www.kaggle.com/guardian-consent-minor-use
  (only its title could be read when checked; read it in a browser). GitHub needs 13 or older.
- Have the key ready (GUIDE-COREY-UBUNTU part B) and the files from `aider/` on a USB stick.

---

## Step 1. Check the laptop (with Corey)

1. **Win+R**, type `winver`, Enter. Write down the version (for example 24H2).
2. **Ctrl+Shift+Esc** (Task Manager) > **Performance**: write down the **CPU** name and total
   **Memory** (we expect 8 GB).
3. **File Explorer > This PC**: write down free space on C:. Aider and Python need about 1 GB
   [test this first].
4. **Settings > Windows Update**: write down the date of the last installed update. If updates
   no longer install, tell Corey.
5. **Corey, from his admin account:** in PowerShell type `net localgroup administrators`.
   The son's account name must **not** be in the list.
6. **Windows Security**: real-time protection on; App & browser control > reputation-based
   protection (SmartScreen) on; note what Smart App Control says. Do not assume any of these
   are on until you have looked.

All the AI work happens on Kaggle. The laptop only runs git, an editor and Aider.

---

## Step 2. Make your Kaggle account

1. Register at https://www.kaggle.com with **your own** email. Username not your real name.
2. **Settings > Phone verification.** Guides say GPU and internet in notebooks need a verified
   phone; Kaggle's own pages that were checked do not say which features need it. You may need
   **Corey's phone number**; guides also say one number verifies only one account
   [test this first].

---

## Step 3. Make your notebook

1. **Create > New Notebook**. Rename it `kaggle-coder`. It must say **Private**, always: its
   output shows your helper's address.
2. Session options / Settings: **Accelerator: GPU T4 x2**, **Internet: On**
   [test this first: menu names].

---

## Step 4. Add the key as a Kaggle Secret (with Corey)

**Add-ons > Secrets > Add secret**. Label `CODER_API_KEY` (exactly). Value: Corey types the key.
Tick it for **this notebook**. The key now lives in Kaggle's secret store, not in your code.
That is how professionals do it.

---

## Step 5. Paste the server code and run it

1. Open `server.py` (from Corey) in Notepad. **Ctrl+A**, **Ctrl+C**.
2. In the notebook's first code cell: delete what is there, **Ctrl+V**, press **Run**.
3. It downloads about 20 GB and checks every file's fingerprint (sha256). Expect 10 to 20
   minutes the first time each session [test this first]. You will see `sha256 ok`,
   `using profile A`, `llama-server is healthy`, `key check passed`.

If you see `STOPPED:` it says why. That is the script protecting you. Tell Corey what it said.
The comments at the top of `server.py` explain each step; reading them is a good lesson.

---

## Step 6. Read your address

At the end it prints:

```
Address (give it to start-helper):  https://some-random-words.trycloudflare.com
Model name:                         kaggle-coder   (profile A)
```

The address is new every session. Never post it, never commit it, never send it with the key.

---

## Step 7. GitHub and Git (with Corey, once)

1. GitHub account with 2-step login. **Settings > Emails**: tick "Keep my email addresses
   private" and "Block command line pushes that expose my email".
2. Install **Git for Windows** with the normal installer as your own (standard) user. New
   terminal: `git --version`.
3. Set your name and the private "noreply" email shown on GitHub's Emails page (it ends in
   `users.noreply.github.com`):
   `git config --global user.name "your-github-username"` and
   `git config --global user.email` followed by that address.
4. Accept Corey's invite to the game repo (you get **Write**, not admin).
5. Clone it to `C:\Users\<you>\code\signal`.

---

> **No admin rights on this laptop, or want the quick way?** Steps 7 (Git), 8 (editor) and 9
> (uv + Aider) can all be done per-user with [the README, Part 1](../README.md): it shows
> each command and why (winget with `--scope user`, or the official site, then a scan), and
> nothing asks for admin. Corey's parts below (hash checks, settings, helper files, key) stay
> the same.

## Step 8. VSCodium, the plain editor (with Corey, once, optional)

1. Install with the **user installer** (`VSCodiumUserSetup-x64-...exe`, GitHub releases page).
   Corey checks its `.sha256`. It should need no admin rights [test this first].
2. Corey copies `vscodium/settings.json` to `%APPDATA%\VSCodium\User\settings.json`.
3. Open `C:\Users\<you>\code\signal` and trust **that folder only**. Never tick "trust the
   parent folder". Other folders stay in Restricted Mode.
4. No extensions: the settings refuse them. That is on purpose.

---

## Step 9. Install uv and Aider (Corey, on the son's account, once)

1. Download `uv-x86_64-pc-windows-msvc.zip` version **0.13.8** from uv's GitHub releases page.
2. PowerShell: `Get-FileHash .\uv-x86_64-pc-windows-msvc.zip -Algorithm SHA256`. The hash must
   equal the one in `kaggle/PINS.md`.
3. Unzip it into `C:\Users\<son>\.local\bin`.
4. Start menu: **Edit environment variables for your account** > **Path** > **New** >
   `%USERPROFILE%\.local\bin` > OK. Open a new terminal: `uv --version` shows 0.13.8.
5. `uv tool install --python 3.12 --exclude-newer 2026-02-13 aider-chat==0.86.2`
   Then `aider --version` shows 0.86.2 [test this first: where uv puts `aider.exe`].
6. Never use `aider-install`, `uv tool upgrade`, or Aider's own upgrade offer.

---

## Step 10. Copy Corey's helper files (Corey, once)

(Same files whichever setup you used. With the README's Part 1, uv comes from `winget` and Node
lives in `C:\Users\<son>\tools`; `aider`, `loop.cmd` and `start-helper.cmd` still go in
`.local\bin`.)

Into `C:\Users\<son>\` (names exactly as shown, including the leading dots):

| From `aider/` | Save as |
|---|---|
| `aider.conf.yml` | `.aider.conf.yml` |
| `model.settings.yml` | `.aider.model.settings.yml` |
| `model.metadata.json` | `.aider.model.metadata.json` |
| `CONVENTIONS.md` | `.aider-conventions.md` |
| `aiderignore` | `.aiderignore-signal` |
| (new, empty file) | `.aider-empty.txt` |
| `start-helper.cmd` | `.local\bin\start-helper.cmd` |
| `loop/loop.cmd` (from the `loop/` folder) | `.local\bin\loop.cmd` |

These live in your home folder, not in the game, so they never reach GitHub.

---

## Step 11. Put the key in your Windows account (with Corey, once)

1. Start menu: **Edit environment variables for your account**.
2. Under "User variables": **New**. Name: `AIDER_OPENAI_API_KEY`. Value: Corey types the key.
   OK, OK.
3. Close and reopen any terminal.

This keeps the key out of every file and out of PowerShell's saved history. (In Command Prompt,
`setx AIDER_OPENAI_API_KEY paste-the-key-here` does the same; never type it in PowerShell, which
saves what you type.) Every program you start can read it, so the card rules on packages matter.

---

## Step 12. First run (with Corey watching)

1. Kaggle: run the notebook, copy the address.
2. In a terminal, in the game folder:
   `cd $HOME\code\signal` then `git switch -c helper/first-try`
3. `start-helper https://some-random-words.trycloudflare.com` (your address).
4. Type `/ask What does src/main.tsx do?` and read the answer.
5. Type `/exit`. Nice work: you just used a big coding model (30 billion parameters with
   profile A) on cloud GPUs that you set up yourself.

---

## Step 13. Your daily loop: THE LOOP

Daily work runs through `loop` (full page: [loop/LOOP.md](../loop/LOOP.md)). Corey copies
`loop/loop.cmd` next to `start-helper.cmd` once (GUIDE-COREY-UBUNTU part L).

0. Kaggle: run the notebook, copy the address. In the terminal, in the game folder:
   `$env:KC_URL="https://...your address..."` (PowerShell) so `loop` can find it.
1. **[1/5 IDEA]** `loop idea boss-flash` - new branch `v-boss-flash` and a plan note in `ideas\`.
2. **[2/5 DESIGN]** `loop design` - ask-only helper. `/ask` how; write the plan in the note.
3. **[3/5 CODE]** `loop code` - the helper edits after "Edit the files?" and your y.
   - **One small task per session.** `/add` only the one or two files to change, each **under
     about 400 lines** (see "Big files" below).
   - Read the plan, answer y or n. `/diff` to read what changed. Wrong? `/undo`.
   - `/drop` the files and `/clear` before the next task. If it seems to forget, `/tokens`.
   - Never `/run`, `/test`, `/lint`, `/web`, `/code` or `!`. `/exit` when done.
4. **[4/5 TEST]** `loop test` - build, Rule 2 check, then play at http://127.0.0.1:4173.
   (First time on this laptop: `loop setup`.)
5. **[5/5 PUSH]** `loop push` - commit, push, open the pull-request link it prints. Wait for the
   checks and Corey. A red check is a clue to look at together, not a telling-off.
6. **Stop the Kaggle session** (stop button in the notebook's top bar) [test this first]. The
   script also stops itself after 30 idle minutes or 3 hours.

`loop status` shows where you are; `loop undo` takes back the helper's last commit.
Once a week Corey makes a new key; you both update the Kaggle Secret and step 11.

**If you run the game on the laptop with Node:** Corey sets
`npm config set ignore-scripts true --location=user` once. `loop setup` runs
`npm ci --ignore-scripts` and refuses if the package files differ from `main`; never add packages
yourself (card item 1). Never `npm run dev`: it runs Vite with `--host` and shares the game with the
whole network. `loop test` previews on 127.0.0.1 only.

---

## Cline route (side panel)

Only if Corey picked Cline, and only after Corey has run [TEST-CLINE.md](TEST-CLINE.md). Nothing
here is tested. Cline needs streaming, and Cloudflare's docs say quick tunnels do not support it,
so TEST-CLINE uses a separate named tunnel (its step 0). This route replaces steps 8 to 12 and the
`loop design` / `loop code` commands. Steps 1 to 7 still apply.

1. **(with Corey)** Install VS Code ([the README, Part 1](../README.md)).
2. Corey gives you `cline-4.1.26.vsix`. Check it with
   `certutil -hashfile <file> SHA256` against [PINS.md](../kaggle/PINS.md).
3. VS Code > Extensions (`Ctrl+Shift+X`) > **...** > **Install from VSIX...**. The publisher must
   read **saoudrizwan**, id `saoudrizwan.claude-dev`.
4. Corey copies [cline/settings.json](../cline/settings.json) to
   `%APPDATA%\Code\User\settings.json` (back up the old one first). It turns Copilot off and
   blocks every other extension.
5. Corey copies [cline/rules.md](../cline/rules.md) to `Documents\Cline\Rules\signal-below.md`.
6. In Cline's settings: provider **OpenAI Compatible**, Base URL = the **Cline Base URL** your
   notebook printed, model `kaggle-coder`, context window `32768`, max output `4096`. Corey types
   the key into **Cline's own key box**, never into a file.
7. Leave every **auto-approve** switch **off**. Say **no** to every command it wants to run, and
   write it down for Corey.
8. Each change: **Plan** first, then **Act**. Read the diff, then approve or reject. Before
   `loop push`, check the changed files in **Source Control** (`Ctrl+Shift+G`).

Also read the Cline notes under "Where keys may live" in [SAFETY-BRIDGE.md](SAFETY-BRIDGE.md).

---

## Big files

`BuriedComplexGame.tsx` (about 2,700 lines) and `deep-signal-engine.ts` (about 2,700 lines) are
far bigger than the helper can read at once. Do not `/add` them. Instead `/ask` your question,
and paste in only the one function you mean. Splitting them into smaller files is a great
learning project, and it is your call: plan it with Corey if you want to try.

---

## Fallback: sending a zip

If GitHub is down or stuck: zip the game folder (leave out `node_modules`) and send it to Corey
the old way. He checks it with his scanner before it goes live.

## Slow laptop plan

Aider is a terminal program and light already. If VSCodium is too slow, edit with **Notepad++**
(GPL-3.0) or **Geany** (GPL-2.0 or later), both free and open source; close the browser while
coding and check **Task Manager > Memory**. If the tunnel stops working, Corey can switch
`server.py` to `MODE = "notebook"` and you ask questions in a new notebook cell with
`ask("...")`, copying answers by hand.

---

## Troubleshooting

| What you see | Try this |
|---|---|
| `STOPPED: no Kaggle Secret named CODER_API_KEY` | Add-ons > Secrets: check the label and tick it for this notebook. |
| `STOPPED: ... sha256 or size mismatch` | Stop. Do not get around it. Tell Corey. |
| `STOPPED: ... out of GPU memory?` | Corey sets `PROFILE = "A-small"` or `"B"` at the top of the cell. |
| No GPU option / CUDA errors | Phone verification (step 2) may be missing. |
| start-helper: `STOP: the file ... is in this folder` | Do not delete it yourself. Ask Corey. |
| start-helper: `the key is not set` | Step 11, then open a new terminal. |
| 401 / authentication error in Aider | The key on the laptop and the Kaggle Secret differ. |
| Cannot connect | Session stopped or address changed: run the cell again, use the new address. |
| Error 524 or a timeout after about 2 minutes | Ask for a smaller change, `/drop` big files, `/clear`. Tell Corey. |
| Push refused: "would publish a private email" | Step 7.3: use the noreply address. |
| A check on the pull request is red | Click it, read the first error line, ask Corey. |
| **Old laptop:** editor very slow | Close the browser and other apps; Task Manager > Memory. Still slow: Slow laptop plan. |
| **Old laptop:** fan loud | Normal while busy. Use it on a hard surface. Loud while idle: Task Manager > Processes, tell Corey. |
| **Old laptop:** disk almost full | Settings > System > Storage. Empty Downloads and the Recycle Bin with Corey. Keep a few GB free. |

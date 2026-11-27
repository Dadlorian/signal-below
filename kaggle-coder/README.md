# Code The Signal Below with an AI helper
You write your game in VS Code with **Cline**, a side panel. Its AI runs on your own free Kaggle account, on a
fast graphics card (GPU), only while you need it. You get **30 GPU hours a week**. The AI **turns itself off after
10 minutes without a question**, so a short session costs very little.

**Before you start:** be 13 or older (13 to 16: get a parent's [Kaggle consent](https://www.kaggle.com/contact#/privacy/minor)
first). Make a GitHub account and a **phone-verified** Kaggle account (Kaggle Settings > Phone verification: without
it Kaggle blocks the internet the AI needs). Accept Corey's GitHub invite (the email from GitHub).
Asked for an admin password at any point? Stop and ask Corey.

## 1. First time only (about 10 minutes)
Copy each box into **PowerShell**, press Enter, wait for it to finish.
```powershell
winget install --id Git.Git -e --version 2.56.1 --scope user
```
Close PowerShell, open it again, then (sign in to GitHub if asked):
```powershell
git clone https://github.com/Dadlorian/signal-below.git "$HOME\code\signal"
```
Open the folder `code\signal\kaggle-coder` in File Explorer and **double-click `setup.cmd`**. It installs VS Code,
Python and Cline, then asks for your **Kaggle token**: on kaggle.com go to **Settings > API**, make a token, copy it,
paste it into the window (nothing shows while you paste, that is normal) and press Enter. Never share the token.

## 2. Set up Cline (first time only)
Open your game folder in VS Code:
```powershell
code "$HOME\code\signal\project-bolt-stackblitz-starters-kppnjtxg\project"
```
Choose **Trust** if asked. Drag the **Cline** icon to the right side bar. In Cline choose **Bring my own API key**
and set:

| Cline setting | Value |
|---|---|
| API Provider | OpenAI Compatible |
| Base URL and API Key | `start.cmd` puts these on your clipboard for you |
| Model ID | `kaggle-coder` |
| Context Window Size | `65536` |
| Max Output Tokens | `8192` |
| Use Compact Prompt (Settings > Features) | **on** |
| Every auto-approve switch | **off** |

## 3. Every day: start the AI
1. **Double-click `start.cmd`.** It checks your sign-in and GPU hours, then asks **how long you will code**:
   type `30`, `45` or `60`, or just press Enter.
   - A **coding block** (30/45/60) keeps the AI up for that long, even while you are thinking or reading.
   - With just Enter, it turns off after 10 minutes without a question.
2. Watch the one line: *Waiting for a Kaggle GPU*, *Downloading the AI*, *Loading onto the GPUs*, then **READY**.
3. At READY it puts the **Base URL** (and, the first time, the **key**) on your clipboard. Paste each into Cline.
4. Ask Cline for **one small thing**: choose **Plan**, read the plan, then choose **Act**. Read each change
   (red is removed, green is added) and approve or reject it. If Cline wants to run a command or install
   something, say **no** and ask Corey.

If Kaggle has no free GPU, it gives up after 20 minutes and cleans up. Nothing is used.

## 4. When you finish
Press **S** in the start window, or **double-click `stop.cmd`**. Then look at **Active Events** on kaggle.com: if a
session is listed, stop it there (the power button), because the website keeps counting GPU time until it is off.

## If something goes wrong
| You see | Do this |
|---|---|
| Windows asks for an admin password | Say no. Ask Corey. |
| `no internet` | Connect to Wi-Fi, double-click `start.cmd` again. |
| `Kaggle did not accept your sign-in` | Double-click `setup.cmd` and paste a new token. |
| `less than 1 GPU hour left` | Wait for the refresh time it shows. Nothing was started. |
| `Kaggle has no free GPU right now` | Try again in 30 minutes. |
| `STOPPED: ... out of memory` | Tell Corey. |
| Cline says connection or key error | Double-click `start.cmd` again and paste the new Base URL. Type `k` at the key question to copy the key again. |
| Anything else | Send Corey the message and the file `%USERPROFILE%\.kaggle-coder\doctor.txt` (it has no key or address in it). |

## 5. Play your game, and send your work to Corey
Node runs the game. Ask Corey to help you install it the first time. Then:
```powershell
cd "$HOME\code\signal\project-bolt-stackblitz-starters-kppnjtxg\project"
npm.cmd ci --ignore-scripts
npm.cmd run build
npx.cmd --no-install vite preview --host 127.0.0.1 --port 4173
```
Play at <http://127.0.0.1:4173>. `Ctrl+C` stops it. (`npm.cmd ci` only the first time; red `ERR!` means stop and ask.)
Don't use `npm run dev`: it shares your game with your whole network.

To send work: make a branch (change the number each time),
```powershell
cd "$HOME\code\signal"; git switch main; if ($?) { git pull --ff-only }; if ($?) { git switch -c change-1 }
```
and the first time only, with your private `...@users.noreply.github.com` email (GitHub > Settings > Emails):
```powershell
git config --global user.name "YOUR-GITHUB-NAME"
git config --global user.email "YOUR-PRIVATE-EMAIL"
```
In VS Code press `Ctrl+Shift+G`. Read each changed file and press **+** on the ones you meant to change. Type what
you did, press **Commit**, then **Publish Branch**. On GitHub: **Compare & pull request**, **Create pull request**.

---
## For Corey and for developers
```
kaggle-coder/
  setup.cmd  start.cmd  stop.cmd     the only things he double-clicks
  .env.example                       every setting and its default (the real .env is in %USERPROFILE%\.kaggle-coder\)
  src/
    start.ps1    laptop side: checks, sends the server to Kaggle, waits, hands Cline the address, watches
    setup.ps1    first-run installs (VS Code, Python, Cline, Kaggle token)
    server.py    runs ON Kaggle: downloads, loads the model, opens the tunnel, stops itself
    cline-rules.md   rules copied into Cline's rules folder on every start (names no tools: they differ by Cline version)
  fixed-address/   OPTIONAL permanent address (kaggle.gamelab.link) through a Cloudflare Worker; see its README
```
- **Settings** are in `.env` (see `.env.example`); `start.ps1` checks them with friendly errors and sends them to
  `server.py` as one base64 value. Pinned downloads and their sha256 hashes are at the top of `src/server.py`.
- **Measured on real Kaggle (2026-11-27):** the 18.5 GB model downloads in about 2 minutes (150 MiB/s, hash-checked as
  it streams); the programs take 30 s in parallel. Storing the model on Kaggle first saved only about 38 s
  (mounted read 224 MiB/s) at the cost of a 23-minute prep, so it was removed. A free CPU run starts in about 20 s.
- **Not yet run on a real GPU session:** model load time, READY, the tunnel, the idle stop on real Cline traffic, and
  Cline's tool-call format with Qwen3-Coder. First GPU run: set `SELF_TEST=1` once in `.env` (about 0.3 GPU hours),
  note the time to READY and the tool-call and cache lines in the log, then ask Cline one small task.
- Expect roughly 3 to 5 minutes from start to READY plus any queue wait. Under 60 seconds is not possible on Kaggle's
  free batch GPUs.
- **Stopping:** Kaggle's command line has no cancel. `stop.cmd` deletes the notebook (whether that ends a running
  session is unproven), and the server stops itself on idle or `MAX_HOURS`, with Kaggle's own `-t` limit as a backstop.
  Check Active Events on kaggle.com until that is proven.

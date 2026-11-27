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
| Base URL and API Key | shown on the settings card at READY (and by `logs.cmd`) |
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
   It shows how long you have waited and when it will give up. Want the detail? Double-click **`logs.cmd`**
   for a live view of what the AI is doing.
3. At READY it prints a green **settings card** with everything Cline needs (Base URL, key, model, sizes) and puts the
   Base URL on your clipboard. Copy the rest from the card. **Double-click `logs.cmd` any time to see the card again.**
4. Ask Cline for **one small thing**: choose **Plan**, read the plan, then choose **Act**. Read each change
   (red is removed, green is added) and approve or reject it. If Cline wants to run a command or install
   something, say **no** and ask Corey.

Kaggle is sometimes busy. If it has not started after 10 minutes, `start.cmd` sends it again (up to 3 tries, 30 minutes
in all), then gives up and cleans up. A busy Kaggle is not a problem with your setup, and nothing is used while you wait.

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
| Cline says connection or key error | Double-click `logs.cmd`: the card shows the current Base URL and key. The address changes every run. |
| Anything else | Send Corey the message and the file `kaggle-coder\run\last-run.log` (it has no key or address in it). |

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
  setup.cmd  start.cmd  stop.cmd     the things he double-clicks (logs.cmd shows the one log file live)
  .env.example                       every setting and its default. The real file is kaggle-coder\.env (made on first run)
  run/                               everything the tool makes: log, settings card, state, the Kaggle tool (git ignores it)
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
- **Proven on a real GPU session (2026-11-27, 2x Tesla T4, 0.34 GPU hours):**
  - Kaggle start to READY: **320 s** (download 168 s, load onto the GPUs 145 s, tunnel 7 s). GPU memory used: 11.3 and 10.7 GB of 15.3 GB each.
  - Through the public address: 401 without the key, 200 with it, a reply in 0.7 s.
  - Tool calls parse (`parsed tool_calls: True`). The prompt cache works: the same long prompt took 6.3 s, then 0.1 s.
  - Idle stop: warning at 8 quiet minutes, stopped itself at 10, GPUs given back.
  - Billing: T4 x2 counts **1 quota hour per hour** (0.32 hours used in 18.8 minutes).
  - Queue: varies with how busy Kaggle is (see "Queued runs" below): one run waited 4 minutes then started on the re-push;
    on a busier afternoon three pushes over 14 minutes never started.
- **Still to try with the junior:** a real Cline task (the tool-call format is proven, the full agent loop is not), and the
  optional permanent address (Cloudflare Worker).

### Kaggle rules we follow (checked 2026-11-27)
**Official** ([kernels reference](https://github.com/Kaggle/kaggle-cli/blob/main/skills/references/kernels.md),
[docs](https://github.com/Kaggle/kaggle-cli/blob/main/docs/kernels.md); CLI 2.2.5 is the latest release):
- `kernels push` uploads and runs. Pushing to an existing name makes a new version, so we reuse one name.
- A notebook's title and name are linked; the title must match the name.
- The accelerator is a request: "the server decides what a session actually runs on". `NvidiaTeslaT4` means GPU T4 x2.
- There is no cancel command. We stop with `kernels delete`, and the server also stops itself (idle, coding block,
  `MAX_HOURS`), with Kaggle's own `-t` limit as a backstop. The documented way to end a session is Active Events > Stop,
  so `stop.cmd` tells him to check it.

**Community, from a project updated 2026-11-25** ([kaggle-llm-server](https://github.com/Tahsine/kaggle-llm-server)):
- Run it as a background (commit) session, which is what `kernels push` does. Interactive sessions are cut after about 40
  minutes of browser inactivity; background ones can run up to 12 hours. Weekly GPU quota is about 30 hours.
- Internet in notebooks needs a phone-verified account. The Cloudflare quick tunnel beats ngrok for long streams.
- Even with files stored in a private Dataset, they report about **5 to 6 minutes** to a working server. Expect that, plus
  any queue wait. Under 60 seconds is not possible.

**Queued runs, and what we do about it:**
- Developers report that Kaggle sometimes leaves a pushed run `QUEUED` for good, and that a fresh push then starts normally
  ([example](https://github.com/eslam733/voicetut-kaggle/pull/3), [another](https://github.com/amasat01/eagle/pull/17)).
  Kaggle's forum also has recent threads about sessions stuck in the queue ([one](https://www.kaggle.com/product-feedback/757624)).
- So `start.ps1` waits 10 minutes (the interval a working project uses), deletes the notebook and pushes again, up to 3 tries.
  Each re-push goes to the back of Kaggle's queue, so more frequent restarts would only make it worse.
- It is mostly **capacity**, not our setup. Kaggle staff say there are "far more user sessions than machines" at times
  ([thread](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2/discussion/743927)). Proof from our own tests: an identical tiny GPU
  job started in 3 to 4 seconds at 13:30 and sat queued for 157 seconds at 15:34, and the notebook name made no difference.
- Kaggle's status answer holds only the state and an (empty) failure message. There is no queue position and no reason.

**Not confirmed (do not rely on it):**
- Why a run sticks: nothing official explains it. It was not the accelerator name, internet access or the time limit.
- A Kaggle staff post says 1 interactive plus 2 background GPU sessions at once ([source](https://www.kaggle.com/general/105509),
  undated), so we never run more than one at a time.
- Whether running a tunnel from a notebook is allowed. No rule mentions it; some sources say the terms limit use to personal
  use. Read kaggle.com/terms before relying on this.

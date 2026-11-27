# Code The Signal Below with an AI helper
You write your game in VS Code with **Cline**, a side panel. Its AI runs on your own free Kaggle account, on a
fast graphics card (GPU), only while you need it. You get **30 GPU hours a week**. A session uses about 1 to 2,
so stop it when you are done.

**Before you start:** be 13 or older (13 to 16: get a parent's [Kaggle consent](https://www.kaggle.com/contact#/privacy/minor)
first). Make a GitHub account and a **phone-verified** Kaggle account (Kaggle Settings > Phone verification).
Accept Corey's GitHub invite (the email from GitHub). Asked for an admin password at any point? Stop and ask Corey.

## 1. First time only (about 10 minutes, then a wait)
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

At the end it offers to **store the AI on your Kaggle account**. Type `y`. It is free (no GPU hours), takes
15 to 40 minutes, and makes every later start fast. It finishes with a free check that must say `model found`.
If it says `NOT found`, tell Corey.

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
| Model ID | `kaggle-coder` |
| Context Window Size | `65536` |
| Max Output Tokens | `8192` |
| Every auto-approve switch | **off** |

## 3. Every day: start the AI
1. **Double-click `start.cmd`.** It shows your GPU hours left, then a timer: *Waiting for a Kaggle GPU*, then
   *Loading the model*, then **READY**.
2. At READY it puts the **key** (first time only) and the **Base URL** on your clipboard, one after the other.
   Paste each into Cline's boxes (right-click > Paste) and press Enter in the window when asked.
3. Ask Cline for **one small thing**: choose **Plan**, read the plan, then choose **Act**.
4. Read each change (red is removed, green is added) and approve or reject it. If Cline wants to run a
   command or install something, say **no** and ask Corey.

It stops itself after **10 minutes without a question** (a warning at 8) and after **2 hours at most**.
If it has not started after **20 minutes**, `start.cmd` gives up and cleans up.

## 4. When you finish
**Double-click `stop.cmd`.** Then look at **Active Events** on kaggle.com: if a session is listed, stop it there
(the power button), because the website keeps counting GPU time until it is off.

## If something goes wrong
| You see | Do this |
|---|---|
| Windows asks for an admin password | Say no. Ask Corey. |
| Waiting more than 20 minutes | Kaggle is busy. It stops by itself. Try again later. |
| Cline says connection or key error | Double-click `start.cmd` again and paste the new Base URL. |
| Lost the key in Cline | In PowerShell: `cd "$HOME\code\signal\kaggle-coder"`, then `.\start.cmd -CopyKey` |
| Not sure what is running | Same folder, `.\start.cmd -Status` (shows hours left and run state) |
| `STOPPED: ... out of memory` | Tell Corey. |
| Anything else | Send Corey the message, **without your key or the web address**. |

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
  .env.example                       lists every setting; the real .env lives in %USERPROFILE%\.kaggle-coder\
  src/
    start.ps1    laptop side: sends the server to Kaggle, waits, hands Cline the address
    setup.ps1    first-run installs; offers the one-time model storage
    server.py    runs ON Kaggle: loads the model, opens the tunnel, stops itself when idle
    cline-rules.md   rules copied into Cline's rules folder on every start
  fixed-address/   OPTIONAL permanent address (kaggle.gamelab.link) through a Cloudflare Worker
```
- **Nothing has run on a real GPU yet.** Test order, cheapest first (none of the first two uses GPU hours):
  1. `setup.cmd`, answering `y` to storing the AI. It checks the saved model's size. If Kaggle's output limit
     (about 20 GB) is too small it says so, and starts still work by downloading the model each time.
  2. The free check it runs next: a CPU run that must find the stored model and prints how fast it reads.
  3. Read Kaggle's current Terms before any GPU run (tunnels are the open question).
  4. `start.cmd -Test` once (about 0.1 GPU hours): note the time to READY and the `cache check` line, where the
     second answer should be several times faster than the first.
- Expect about 2 to 4 minutes after Kaggle starts the run, plus any queue wait. Under 60 seconds is not possible
  on Kaggle's free batch GPUs.
- Extra switches (add after `start.cmd`): `-Status`, `-CopyKey`, `-Test`, `-DryRun`, `-PrepModel`, `-Web` (a
  browser-notebook fallback if Kaggle keeps you waiting).
- Pinned downloads and their sha256 hashes are at the top of `src/server.py`. Change them there only.

# Code The Signal Below with an AI helper

You code in VS Code. **Cline**, the side panel, shows each change before it saves it. The AI
runs on your own free Kaggle account.

> **Not tested yet.** If Cline never answers in step 4, stop and tell Corey.

**First:** be 13 or older (13 to 16: get a parent's
[Kaggle consent](https://www.kaggle.com/contact#/privacy/minor) before signing up). Make a
GitHub account and a phone-verified Kaggle account. Accept Corey's GitHub invite.

**Boxes:** unless a step says otherwise, copy one box into **PowerShell** (Start menu, type
PowerShell), press Enter and wait. Asked for an admin password? Stop and ask Corey.

## 1. Install (once)

```powershell
winget install --id Git.Git -e --version 2.56.1 --scope user
```
```powershell
winget install --id Microsoft.VisualStudioCode -e --version 1.146.0 --scope user
```

Close PowerShell and open it again.

```powershell
code --install-extension saoudrizwan.claude-dev@4.1.26
```

Next is Node, which runs the game.

```powershell
curl.exe -fLo "$HOME\Downloads\node.zip" https://nodejs.org/dist/v26.13.1/node-v26.13.1-win-x64.zip
```
```powershell
(Get-FileHash "$HOME\Downloads\node.zip").Hash -eq 'e2edda75bfb089654705cf65a13b58933bfd5f57148e8ebda916f58a2474f1f7'
```

It must say `True`. If not, stop.

```powershell
New-Item -ItemType Directory -Force "$HOME\tools" | Out-Null; tar -xf "$HOME\Downloads\node.zip" -C "$HOME\tools"
```
```powershell
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ";$HOME\tools\node-v26.13.1-win-x64", 'User')
```

Close PowerShell and open it again.

## 2. Get the game (once)

If a sign-in window opens, sign in to GitHub.

```powershell
git clone https://github.com/Dadlorian/signal-below.git "$HOME\code\signal"
```
```powershell
code "$HOME\code\signal"
```

In VS Code, trust this folder. Press `Ctrl+,`, search `chat.disableAIFeatures` and tick it.
This turns Copilot off.

## 3. Set up the AI (once)

1. On Kaggle: **New Notebook**. Keep it **Private**. In its settings choose **GPU T4 x2** and
   turn **Internet** on.
2. Copy this into the first notebook cell:

   ```python
   import os
   os.environ["KC_CTX"] = "32768"
   os.environ["KC_MAX_OUT"] = "4096"
   ```

3. In VS Code's file list open `kaggle-coder` > `server.py`. Press `Ctrl+A`, `Ctrl+C`, and paste
   it in the same cell **below** those lines. Don't run it yet.
4. Click the **Cline** icon. Choose to use your own API key (no Cline account), then the gear:

   | Setting | Value |
   |---|---|
   | API Provider | OpenAI Compatible |
   | Model ID | `kaggle-coder` |
   | Model Configuration > Context Window Size | `32768` |
   | Model Configuration > Max Output Tokens | `4096` |

5. Turn **every auto-approve switch off**, so you decide what changes.
6. In Kaggle open **Add-ons > Secrets** and add a secret. **Type** its name: `CODER_API_KEY`.
7. Make your key. This copies it without showing it:

   ```powershell
   -join ((1..2) | ForEach-Object { [guid]::NewGuid().ToString('N') }) | Set-Clipboard
   ```

8. Paste it as the secret's value (tick it for this notebook) **and** in Cline's **API Key** box.
   The key stops others using your AI. Never put it in a file, chat or screenshot.

## 4. Start coding (every time)

1. Run the Kaggle cell. It keeps running. Wait for the `https://....trycloudflare.com` address,
   even if it is slow.
2. In Cline's **Base URL** box, paste the address and add `/v1`. It is new every time.
3. Choose **Plan** and ask: `What does this game do? Do not change anything.`
4. For a change: do the first box in step 6, say what you want, read the plan, choose **Act**.
5. Read each change (red is removed, green is added). **Approve** or reject it. If Cline wants to
   run a command or install something, say no and ask Corey.
6. When you finish, press **Stop session** in Kaggle. Closing the tab may not stop it.

## 5. Play your game

```powershell
cd "$HOME\code\signal\project-bolt-stackblitz-starters-kppnjtxg\project"
```

First time only (red `ERR!`? Stop and ask):

```powershell
npm.cmd ci --ignore-scripts
```
```powershell
npm.cmd run build
```
```powershell
npx.cmd --no-install vite preview --host 127.0.0.1 --port 4173
```

Open <http://127.0.0.1:4173>. Press `Ctrl+C` to stop. Don't use `npm run dev`: it shares your
game with your whole network.

## 6. Send your work to Corey

**Before you change anything**, start a fresh branch (your own copy of the changes). Use a new
number each time. If a line shows an error, stop and ask.

```powershell
cd "$HOME\code\signal"; git switch main; if ($?) { git pull --ff-only }; if ($?) { git switch -c change-1 }
```

First time only, tell Git who you are. Put in your GitHub name, and the private
`...@users.noreply.github.com` email from GitHub > Settings > Emails.

```powershell
git config --global user.name "YOUR-GITHUB-NAME"
```
```powershell
git config --global user.email "YOUR-PRIVATE-EMAIL"
```

When your change works: in VS Code press `Ctrl+Shift+G`. Click each file and read it. Press
**+** on the files you meant to change, type what you did, press **Commit**, then
**Publish Branch**. On GitHub press **Compare & pull request**, then **Create pull request**.

## Stuck?

Send Corey the error message, **without your key or the web address**.

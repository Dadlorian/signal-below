# Code The Signal Below with an AI helper
You code in VS Code with **Cline**, a side panel. Its AI runs on your own free Kaggle account.

> **Not tested yet against real Kaggle.** If something doesn't work as written, stop and tell Corey.

**First:** be 13 or older (13 to 16: get a parent's [Kaggle consent](https://www.kaggle.com/contact#/privacy/minor)
before signing up). Make a GitHub account and a phone-verified Kaggle account. Accept Corey's GitHub invite.

Copy one box at a time into **PowerShell**, press Enter and wait. Asked for an admin password? Stop and ask Corey.
## 1. Set up (once)
```powershell
winget install --id Git.Git -e --version 2.56.1 --scope user
```
```powershell
winget install --id Microsoft.VisualStudioCode -e --version 1.146.0 --scope user
```
```powershell
winget install --id Python.Python.3.13 -e --scope user
```
Close PowerShell and open it again.
```powershell
code --install-extension saoudrizwan.claude-dev@4.1.26
```
Node runs the game. The second box must say `True`. If not, stop.
```powershell
curl.exe -fLo "$HOME\Downloads\node.zip" https://nodejs.org/dist/v26.13.1/node-v26.13.1-win-x64.zip
```
```powershell
(Get-FileHash "$HOME\Downloads\node.zip").Hash -eq 'e2edda75bfb089654705cf65a13b58933bfd5f57148e8ebda916f58a2474f1f7'
```
```powershell
New-Item -ItemType Directory -Force "$HOME\tools" | Out-Null; tar -xf "$HOME\Downloads\node.zip" -C "$HOME\tools"
```
```powershell
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ";$HOME\tools\node-v26.13.1-win-x64", 'User')
```
Close PowerShell and open it again. Get the game (sign in to GitHub if asked):
```powershell
git clone https://github.com/Dadlorian/signal-below.git "$HOME\code\signal"
```
On Kaggle, go to **Settings > API**, make a token and copy it. Never share it. Paste it when asked (it stays hidden):
```powershell
$d="$HOME\.kaggle"; New-Item -ItemType Directory -Force $d | Out-Null; $s=Read-Host "Paste Kaggle token" -AsSecureString; [IO.File]::WriteAllText("$d\access_token", [Net.NetworkCredential]::new('', $s).Password.Trim())
```
## 2. Open your game
Always open this **game folder**. The folder above it has old copies you could edit by mistake.
```powershell
code "$HOME\code\signal\project-bolt-stackblitz-starters-kppnjtxg\project"
```
First time only:
- Trust the folder. If Git asks about a parent folder, choose to open that repository.
- Press `Ctrl+,`, search `chat.disableAIFeatures` and tick it (turns Copilot off).
- Press `Ctrl+Alt+B`, drag the **Cline** icon into the right side bar, then press `Ctrl+Shift+E`. Now it's files left,
  code middle, Cline right.
## 3. Start the AI
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\code\signal\kaggle-coder\start.ps1"
```
Do what it says. Paste what it copies into Cline: your key the first time, the **Base URL** every time. It also gives
Cline its rules. Never share your key. If Kaggle keeps you in line for 20 minutes, it gives up and tells you.

First time only, on Cline's first screen choose **Bring my own API key**:

| Cline setting | Value |
|---|---|
| API Provider | OpenAI Compatible |
| Model ID | `kaggle-coder` |
| Context Window Size (under Model Configuration) | `65536` |
| Max Output Tokens (under Model Configuration) | `8192` |
| Every auto-approve switch | **off**, so you decide what changes |
## 4. Make a change
1. Make a fresh branch (a separate line of work). Change the number each time. Error? Stop and ask.
   ```powershell
   cd "$HOME\code\signal"; git switch main; if ($?) { git pull --ff-only }; if ($?) { git switch -c change-1 }
   ```
2. In Cline, choose **Plan** and ask for **one small thing**. Happy with the plan? Choose **Act**.
3. Read each change (red is removed, green is added), then approve or reject it. If Cline wants to run a command or
   install something, say no and ask Corey.
## 5. Play your game
```powershell
cd "$HOME\code\signal\project-bolt-stackblitz-starters-kppnjtxg\project"
```
First time only (red `ERR!`? Stop and ask):
```powershell
npm.cmd ci --ignore-scripts
```
After every change, build it, then play it at <http://127.0.0.1:4173>. `Ctrl+C` stops it. Don't use `npm run dev`: it
shares your game with your whole network.
```powershell
npm.cmd run build
```
```powershell
npx.cmd --no-install vite preview --host 127.0.0.1 --port 4173
```
## 6. Stop the AI (every time)
```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\code\signal\kaggle-coder\start.ps1" -Stop
```
Then check that **Active Events** on Kaggle is empty. If it isn't, stop the session there. Forgot? The AI is set to
stop itself after 10 quiet minutes, or 3 hours at most.

Cline lost your key? Run the start command again with ` -CopyKey` on the end.
## 7. Send your work to Corey
First time only. Use your private `...@users.noreply.github.com` email (GitHub > Settings > Emails).
```powershell
git config --global user.name "YOUR-GITHUB-NAME"
```
```powershell
git config --global user.email "YOUR-PRIVATE-EMAIL"
```
In VS Code press `Ctrl+Shift+G`. Read each changed file and press **+** on the ones you meant to change. Type what
you did, press **Commit**, then **Publish Branch**. On GitHub: **Compare & pull request**, **Create pull request**.
**Stuck?** Send Corey the error message, **without your key or the web address**.

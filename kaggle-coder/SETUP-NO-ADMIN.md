# Set up your coding lab (no admin needed)

You will install four things. Every step shows **what to type** and **why**. Nothing is hidden:
you can read every command before you run it.

> **Three rules**
> 1. **Admin password pop-up? STOP.** Close it and tell Corey. You never need "Run as administrator".
> 2. **Only the official site, or `winget`** (Microsoft's own installer tool). Never a link someone sent you.
> 3. **Scan it before you run it** (Step 2).

---

## Step 1. Open a terminal

Start menu, type **Terminal**, press Enter (a normal click, not "Run as administrator").
Then type: `winget --version`

*Why:* winget is already on Windows 11. If it prints a version number, you have it.

## Step 2. The scan habit (do this for anything you download)

**Easiest: Windows already has a scanner.**
Right-click the file, choose **Show more options**, then **Scan with Microsoft Defender**.

**No antivirus, or want a second opinion? Use VirusTotal** (a free site that runs a file through
dozens of scanners): <https://www.virustotal.com>
- Click **File**, pick the file, wait for the results. Files up to 650 MB work.
- Or look it up **without uploading**: run `certutil -hashfile "C:\path\to\file" SHA256` and paste
  the long code (the file's *fingerprint*) into the search box.
- **Only upload things from official sites.** VirusTotal shares what you upload with security
  researchers. Never upload your own code, school work or anything private.

**Reading the result**
- Nobody flags it: no alarms. Good.
- One or two small scanners flag a big company's file: that can be a false alarm. Ask Corey.
- Defender, or lots of scanners, flag it: delete it and tell Corey.

A clean scan means **no alarms found**. It is not a promise: brand-new tricks are not in the
scanners yet. That is why we also use only official sites and read what we run.

## Step 3. Install the tools

For each tool pick the **quick way** (winget) or the **careful way** (download, scan, run).

### Git (saves versions of your code and sends it to GitHub)

Quick way:
```
winget show --id Git.Git -e --version 2.56.1
winget install --id Git.Git -e --version 2.56.1 --scope user
```
*Why each part:* `show` lets you read who made it and where it downloads from. `--version` picks a
release that has been out a while. `--scope user` installs for **your account only** (no admin).
winget checks the download's fingerprint against Microsoft's list. **Never add
`--ignore-security-hash`**: that switches the check off.

Careful way: download from <https://git-scm.com/download/win>, scan it (Step 2), run it.
[test this first: it should install just for you when you are not an admin]

### VS Code (the editor where you write code)

Quick way:
```
winget show --id Microsoft.VisualStudioCode -e --version 1.146.0
winget install --id Microsoft.VisualStudioCode -e --version 1.146.0 --scope user
```
Careful way: <https://code.visualstudio.com/Download>, pick **User Installer** (not "System"), scan, run.

Afterwards: open VS Code, Settings (`Ctrl+,`), search **telemetry**, set it to **off**.
*Why:* it stops the editor sending usage reports.

### Node.js (runs the tools that build the game)

Node's winget package is installed for the whole computer, which needs admin, so use the zip:

1. Open <https://nodejs.org/dist/v26.13.1/> and download `node-v26.13.1-win-x64.zip`.
2. **Scan it** (Step 2).
3. Check its fingerprint matches the official list. In the terminal:
   `certutil -hashfile "$HOME\Downloads\node-v26.13.1-win-x64.zip" SHA256`
   then open <https://nodejs.org/dist/v26.13.1/SHASUMS256.txt> and find the same file name.
   The two codes must match exactly. If not, delete the file and tell Corey.
4. Unzip it into your own folder:
   ```
   mkdir $HOME\tools
   tar -xf $HOME\Downloads\node-v26.13.1-win-x64.zip -C $HOME\tools
   ```
   *Why:* `tar` is built into Windows 11. Your folder needs no admin rights.

### uv (only if Corey says you are using the Aider helper)

```
winget show --id astral-sh.uv -e --version 0.13.8
winget install --id astral-sh.uv -e --version 0.13.8
```
Then Corey gives you the one `uv tool install` line for the helper (it is in `kaggle/PINS.md`).

## Step 4. Tell Windows where Node lives

Windows finds commands by looking in the folders on your **Path**.
Start menu, type **Edit environment variables for your account** (the *account* one, not the
system one), then **Path**, **Edit**, **New**, and paste:
`C:\Users\<your name>\tools\node-v26.13.1-win-x64`, then OK, OK.

*Why this way:* it only changes **your** account. Please do not use `setx PATH`; it can cut your
Path short and mix up settings.

## Step 5. Is it working?

**Close the terminal and open a new one** (so it reads the new Path), then:
```
git --version
node --version
npm.cmd --version
code --version
```
Each one should print a number. (We type `npm.cmd` because PowerShell can refuse `npm` itself.
[test this first])

If one says "not recognized": close and reopen the terminal, then check the Path from Step 4.

## Step 6. The coding helper

**Cline (the chat panel in VS Code):** press `Ctrl+Shift+X`, search **Cline**, check the publisher
says **saoudrizwan**, click Install. Corey sets up its connection and turns the auto-approve
switches **off**, so it always asks before it writes a file or runs a command.

**Aider (the terminal helper):** Corey tells you if you are using this one. Its steps are in
[GUIDE-WINDOWS.md](GUIDE-WINDOWS.md) steps 9 to 12.

**The helper key** is a secret password. Put it in only the places Corey shows you (the Cline key
box, or the Windows "Edit environment variables for your account" window). **Never** type it into
the terminal, a file in your game folder, a chat or a screenshot: the terminal remembers what you
type, and GitHub is public.

## Step 7. Get the game and try it

```
git clone https://github.com/Dadlorian/signal-below.git $HOME\code\signal
cd $HOME\code\signal
loop setup
loop test
```
*Why:* `clone` copies the game to your laptop. `loop setup` installs the game's own packages from
its lock file. `loop test` builds it and shows it at <http://127.0.0.1:4173>. Corey puts
`loop.cmd` on your Path for you. Then read [loop/LOOP.md](loop/LOOP.md): the 5-step loop.

---

## Stuck?

| Problem | Try |
|---|---|
| A window asks for an admin password | Stop. Tell Corey. |
| "winget is not recognized" | Tell Corey; Windows may need an update. |
| Defender or SmartScreen blocks a file | Do not click around the warning. Tell Corey which file. |
| Downloads are blocked (school or work laptop) | That laptop has its own rules. Tell Corey. |
| "running scripts is disabled" | That rule is for PowerShell script files. Our `loop` commands are `.cmd` files, so it should not apply. [test this first] |
| A scan flags a file | Step 2: delete it and tell Corey. |

Nothing here has been run on a real teen laptop yet. If a step does not match what you see, tell
Corey exactly what the screen says. That is how we fix this page.

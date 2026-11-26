# Quick setup, no admin needed (Windows 11) ⚡

Git, Node.js, VS Code and a coding helper, installed for **your account only**, in about
**20 minutes plus download time**. Nothing here needs "Run as administrator".

> [!IMPORTANT]
> **If anything asks for an administrator password: STOP and ask Corey.** Don't click "Yes" to
> get past it. That box means something wants to change the whole computer, and we never need that.

Everything goes into one folder: **`%LOCALAPPDATA%\kc-tools`** (that's
`C:\Users\<you>\AppData\Local\kc-tools`). Every download comes from the official link in
[kaggle/PINS.md](kaggle/PINS.md) ("Windows tools"), and every file is checked against its sha256
fingerprint before it is used. Nothing here has been tested yet: steps marked
[test this first] are unconfirmed.

---

## 1. Check your account (2 min)

1. Start > type **Terminal** > open it (normal click, **not** "Run as administrator").
2. Type: `whoami /groups | findstr /c:"S-1-5-32-544"`
   - **No output** = you are a standard user. Good.
   - **A line with "Administrators"** = this account is an admin. Tell Corey before you go on.
3. **Settings > Windows Update**: you should see a recent "Last checked" date. Old date or an
   error? Tell Corey.
4. **Windows Security > Virus & threat protection**: "Real-time protection" should be **On**.
   Don't assume it is: look.

## 2. Get the tools: fast path (5 min + downloads)

Corey gives you `setup-tools.cmd` (from `loop/`). It downloads the pinned files, checks every
fingerprint **before** unpacking, unpacks them into `kc-tools`, and adds them to *your* Path.
It is marked UNTESTED: Corey runs it once with you first.

1. Save `setup-tools.cmd` in your **Downloads** folder.
2. In Terminal: `cd $HOME\Downloads` then `.\setup-tools.cmd`
3. You should see `Hash OK` four times and `DONE`. Want the Terminal helper (step 5B) too? Use
   `.\setup-tools.cmd with-aider`.
4. `STOP: ... does not match` = the file is not the one the vendor published. **Do not work
   around it.** Tell Corey.
5. Git step says "tar could not unpack it"? Double-click the PortableGit file it names, set the
   folder to `%LOCALAPPDATA%\kc-tools\git`, OK, then run `setup-tools.cmd` again. (It is a
   self-unpacking archive, not an installer.)

**Close Terminal, open a new one**, then jump to step 4.

## 3. Get the tools by hand (instead of step 2)

For each row in PINS.md "Windows tools" (VS Code ZIP, PortableGit, Node.js ZIP):

1. Download it from the URL in PINS.md (copy-paste the link, don't search for it).
2. Check the fingerprint: `certutil -hashfile $HOME\Downloads\<file> SHA256`
   The long code must equal the one in PINS.md, every character. Different? Delete it, tell Corey.
3. Unpack:
   - **VS Code ZIP**: right-click > Extract All > `%LOCALAPPDATA%\kc-tools\vscode`. Then make a
     new empty folder `data` inside `vscode` (that keeps VS Code "portable": settings live here).
   - **PortableGit**: double-click it, folder `%LOCALAPPDATA%\kc-tools\git`, OK.
   - **Node.js ZIP**: Extract All > `%LOCALAPPDATA%\kc-tools` (you get `node-v26.13.1-win-x64`).

## 4. Put the tools on your Path (2 min)

Your **user** Path tells Windows where your programs are. Only yours, no admin.

1. Start > type **environment** > click **Edit environment variables for your account**.
2. Top box "User variables for <you>": click **Path** > **Edit**.
3. Click **New** and paste each of these, one per line:
   `%LOCALAPPDATA%\kc-tools\vscode\bin`
   `%LOCALAPPDATA%\kc-tools\git\cmd`
   `%LOCALAPPDATA%\kc-tools\node-v26.13.1-win-x64`
   `%USERPROFILE%\.local\bin`   (for `loop.cmd`, `start-helper.cmd`, `aider`)
4. OK, OK. Close Terminal and open a new one.

Or in Terminal (adds one folder, only if it is missing):
```powershell
$d="$env:LOCALAPPDATA\kc-tools\git\cmd"; $p=[Environment]::GetEnvironmentVariable('Path','User'); if(($p -split ';') -notcontains $d){[Environment]::SetEnvironmentVariable('Path',($p.TrimEnd(';')+';'+$d).TrimStart(';'),'User')}
```
Never `setx PATH ...`: it copies the system Path into yours and cuts everything after 1024
characters. [test this first: whether the one-liner keeps `%...%` entries in an existing Path]

## 5. Is it working? (1 min)

New Terminal window, type each line. Each should print a version number:
```
git --version
node --version
npm.cmd --version
code --version
loop help
aider --version        (only if Corey chose the Terminal helper)
```
(`npm.cmd` because PowerShell may block `npm`'s own `.ps1` script; Command Prompt can use plain
`npm` [test this first].) "not recognized"? Re-check step 4 and open a new window.

## 6. VS Code settings (2 min)

Corey copies the safety settings into `%LOCALAPPDATA%\kc-tools\vscode\data\user-data\User\settings.json`
(from `vscodium/settings.json`: telemetry off, Restricted Mode for new folders, no automatic
tasks, no extensions except the one he approves) [test this first: the setting names in VS Code].
At least: File > Preferences > Settings > search **telemetry** > Telemetry Level: **off**.

## 7. The coding helper: Corey picks ONE after his test

### 7A. Panel helper: Cline (inside VS Code)
1. Corey gives you `cline-4.1.26.vsix`; check it with `certutil` like step 3 (hash in PINS.md).
2. VS Code > Extensions (Ctrl+Shift+X) > **...** > **Install from VSIX...** > pick the file.
   Publisher must read **saoudrizwan**, id `saoudrizwan.claude-dev`.
3. In Cline's settings: provider **OpenAI Compatible**, base URL = your Kaggle address + `/v1`,
   model `kaggle-coder`, and Corey types the key into **Cline's own key box** (not a file).
4. Leave every **auto-approve** switch **off**: Cline then asks before each edit and command.
   Say **no** to every command it wants to run; write it down for Corey.
   [test this first: Cline may need streaming, which the quick tunnel cannot do]

### 7B. Terminal helper: Aider (with `loop`)
1. Needs `setup-tools.cmd with-aider` (or uv from PINS.md by hand into `kc-tools\uv`, on Path).
2. New Terminal: `uv tool install --python 3.12 --exclude-newer 2026-02-13 aider-chat==0.86.2`
3. Corey copies the helper files (GUIDE-WINDOWS step 10).
4. **The key**: Start > **Edit environment variables for your account** > **New** > name
   `AIDER_OPENAI_API_KEY`, value: Corey types it. OK.

**Never type the key in PowerShell** (it saves what you type in a history file) and never put
it in any file in the game folder. Then use `loop` (see [loop/LOOP.md](loop/LOOP.md)).

## 8. First clone and test (5 min)

```
git clone https://github.com/<owner>/<repo>.git $HOME\code\signal
cd $HOME\code\signal
loop setup
loop test
```
Open http://127.0.0.1:4173 and play. That's your own copy running on your own machine.
**You just set up a dev environment without admin rights. Nice.**

## Stuck? 🧭

| You see | Do |
|---|---|
| A password box for an administrator | **STOP.** Ask Corey. |
| School or club laptop, downloads or programs blocked by "your organization" | It's locked by policy. Don't try to get around it. Tell Corey. |
| Antivirus warning about a file you downloaded | Don't open it. Check its hash (step 3). Tell Corey either way. |
| SmartScreen "Windows protected your PC" | Don't click "Run anyway". Check the hash, show Corey. |
| Browser says the download is blocked | Tell Corey. Don't use another site. |
| "running scripts is disabled on this system" | That's PowerShell's script rule for `.ps1` files. Our `loop.cmd`, `start-helper.cmd` and `setup-tools.cmd` are `.cmd` files, run by cmd, so it doesn't apply to them. For npm, type `npm.cmd`. |
| `STOP:` from any of our scripts | It's protecting you. Read the line, tell Corey. |

Passing these checks means **no indicators found by these checks**: the files match what the
vendors published. That can't prove the tools are harmless, and tools you install still run
as you and can read your files (see SAFETY-BRIDGE.md).

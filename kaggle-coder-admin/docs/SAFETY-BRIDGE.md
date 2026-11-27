# The safety bridge

The coding helper is a smart text box with a pen: it can suggest code and, after you say yes,
write it into your files. Several layers sit between "the helper wrote something" and "it runs
on your laptop" or "it goes live in the game". Each layer catches some things and misses others,
which is why there are several.

None of this has been tested yet. Items marked [test this first] are unconfirmed.

## The layers

| # | Layer | What it does for you | What it can miss |
|---|---|---|---|
| 1 | **Your Windows 11 account** is a standard account; Corey has the admin one. Defender and SmartScreen are on. | Programs cannot change the whole computer behind your back. Known bad files get blocked. | Anything that only touches your own files and browser. New malware. Only counts once Corey has checked it (GUIDE-WINDOWS step 1). |
| 2 | **VSCodium settings**: new folders open in Restricted Mode, no extensions allowed, no tasks start when a folder opens. | A downloaded folder cannot start things the moment you open it. | A click on "Trust". [test this first] on VSCodium. |
| 3 | **Aider, started only with `start-helper`.** It plans first (architect mode) and asks "Edit the files?" before writing. It never suggests or runs commands, never lints or tests by itself, never opens web pages, never updates itself. Every edit becomes its own git commit, so `/undo` takes it back. `start-helper` refuses to start if the folder holds a `.env` or `.aider` settings file, and always uses Corey's settings. | The helper cannot run anything, and cannot change files until you say yes. Mistakes are one `/undo` away. | A "yes" typed without reading the plan. New files and edits to files not in the chat are asked about separately, so read those questions too. The settings live on the laptop and can be changed, so they guard against mistakes, not against someone determined. |
| 4 | **The "Stop and ask Corey" card** (below). | Puts the risky moments in front of Corey. | A moment you do not recognise as one. When unsure, ask. |
| 5 | **GitHub pull requests.** You push to a branch; checks look for keys, tunnel addresses, odd packages and risky settings; Corey must approve. GitHub's own secret scanning and push protection are on. | Nothing reaches `main` without Corey. Pull requests that add a `.env`, `.aider*` or key file fail. | Code that ran on your laptop before you pushed it. A random key that no pattern knows. The checks are advice only: a pull request can change them. |
| 6 | **Corey's review on his Ubuntu server**: he reads the changes and scans them with his own scanner before anything goes live. | The real gate for the live game. | Clever new tricks that no scanner knows yet. |
| 7 | **The Kaggle server**: private notebook; the model server listens only inside Kaggle; every request needs the key; before the tunnel opens it checks that requests without the key get 401; every download is pinned and checked by sha256; it stops itself when idle or after 3 hours. | A stranger who finds the address cannot use the GPU. | Someone who has both the address and the key. Cloudflare can see what you send. |

All the AI work happens on Kaggle. Your laptop only runs the editor, git and Aider.

**THE LOOP** (`loop idea / design / code / test / push`, see loop/LOOP.md) sits on top of
layers 3 and 5. It runs only its own git / npm / start-helper commands and prints each one
first. It never runs a command the AI suggested, never uses `npm install`, previews on
127.0.0.1 only, and `loop push` refuses on `main` or when a key file, key name or tunnel
address is staged. `loop design` starts the helper in ask-only mode; typing `/code` there would
switch to a mode that edits **without** the "Edit the files?" question, which is why `/code` is
on the card.

## Installing tools without admin

[The README, Part 1](../README.md) has no install script on purpose: a script that
downloads and installs by itself hides what is happening and teaches nothing. Instead each step
shows the command and why. Git, VS Code and uv come from `winget` with `--scope user` (for your
account only), pinned to a version with `--version`, and winget checks the download against
Microsoft's manifest hash (never `--ignore-security-hash`). Node.js has no per-user winget
package, so it is the official zip, scanned and checked against nodejs.org's `SHASUMS256.txt`.
Anything asking for an admin password is a STOP. The user Path is changed for your account only,
never the system Path and never with `setx PATH`.

**The scan habit:** every download is scanned with Microsoft Defender (right-click, Show more
options) or, with no antivirus, with VirusTotal (upload, or look up the SHA-256 without
uploading). A clean scan means no alarms found. It does not mean harmless: brand-new malware is
not in the scanners yet, and VirusTotal shares what is uploaded with security researchers, so
only files from official sites go there.

**What this cannot rule out:** a hash read from the same page you download from only proves the
file was not damaged on the way; if that page were tampered with, file and hash could both be
wrong. Corey keeps a reference copy of the versions and hashes in `kaggle/PINS.md` to compare.
Tools installed for one account still run as that account and can read that account's files.

## Where keys may live (and nowhere else)

| Key | Lives only in |
|---|---|
| Coding-helper key | the Kaggle Secret `CODER_API_KEY`, and the son's Windows user environment variable `AIDER_OPENAI_API_KEY` |
| Corey's Kaggle API token (full control of his Kaggle account) | Corey's `~/.kaggle/access_token` on Ubuntu, mode 600 |

Never in the game folder, a commit, a chat, a screenshot, a message, or a note file.

**Cline route:** the coding-helper key goes in Cline's own key box instead of the environment
variable. The named tunnel's token lives only in the Kaggle Secret `KC_TUNNEL_TOKEN` (see
[TEST-CLINE.md](TEST-CLINE.md), step 0). A leaked token means: replace it or delete the tunnel,
and change the key too.

**Cline route, also stop and ask Corey:** any command Cline wants to run; any auto-approve switch
that is on; a project that has `.clinerules`, `.cline/`, `.cursorrules`, `.windsurfrules` or
`AGENTS.md` (Cline reads these as instructions); any request to add an MCP server. The Aider
layers in the table above (2 and 3) do not describe Cline, and Cline is untested.

**If a key leaks** (pushed, pasted, shown on screen to someone, or you are not sure):
1. Stop the Kaggle notebook. The address dies with it.
2. Corey makes a new coding-helper key and replaces it in the Kaggle Secret and on the laptop.
3. If Corey's Kaggle API token leaked: revoke it at https://www.kaggle.com/settings/api, delete
   `~/.kaggle/access_token`, make a new one.
4. If it was pushed to GitHub: it counts as leaked **even after you delete it**. Others may have
   copied it in seconds, and old commits, forks and caches can keep it. Rotating (step 2) is the
   real fix; Corey then removes it from history as clean-up.
5. Tell Corey straight away. That is the right move, not a mistake.

## Stop and ask Corey (print this)

```
+--------------------------------------------------------------------+
|                    STOP AND ASK COREY FIRST                        |
|                                                                    |
|  1. Any new npm package, or any change to package.json "scripts".  |
|  2. Anything downloaded: zips, repos, pasted scripts, commands     |
|     from a website or chat (curl, iwr, powershell lines).          |
|  3. A zip from anyone (even a friend): do not open or unzip it in  |
|     VSCodium. Send it to Corey.                                    |
|  4. Any change to: .continue/ .vscode/ .github/ .husky/            |
|     .gitattributes  vite.config.*  npm config files                |
|  5. Any file whose name starts with .aider, or a .env file, in the |
|     game folder. start-helper says STOP: believe it.               |
|  6. Aider asks "Create new file?" for a name starting with a dot:  |
|     answer No.                                                     |
|  7. Never type /run, /test, /lint, /web, /code or a line with !    |
|     Never add --yes-always. Write the command down, ask Corey.     |
|  8. Aider (or anything) offers to upgrade or install something:    |
|     answer No.                                                     |
|  9. A "Trust this folder?" box. Only the game folder is trusted.   |
| 10. An address from anyone but your own Kaggle screen. Ignore it.  |
| 11. The model name is not "kaggle-coder".                          |
| 12. Anything asking for the key. It lives only in the Kaggle       |
|     Secret and your Windows account settings.                      |
|                                                                    |
|  Asking is a skill, not a failure. Good engineers ask all the time.|
+--------------------------------------------------------------------+
```

Why these: a folder can carry its own settings for Aider, VSCodium, git or npm, and those
settings can start programs or send your key to someone else's server (items 3 to 7). A fake
address lets someone pretend to be the helper and collect your key (items 10 to 12).

## What these checks cannot rule out

Passing every layer means "no indicators found by these checks". It does not mean "harmless".

- **Code you accept.** One "yes" without reading lets a wrong or tricked edit in. Packages you
  install run their code every time the game runs, not only at install.
- **Tricked answers.** Text in your own files, pasted messages or old agent notes can steer the
  model into code that looks normal but is not.
- **The key on the laptop** is a user environment variable, so every program you start can read
  it, including npm scripts. Its unusual name keeps tools from picking it up by accident; it
  does not stop a program that looks for it.
- **The tunnel.** The address is public. The key is the only lock, and Cloudflare sees the
  traffic. Cloudflare says quick tunnels are for testing and development, with no uptime
  guarantee. Never put passwords or personal details in a prompt.
- **Kaggle's rules.** Kaggle's terms ask for personal, non-commercial use. Unconfirmed forum
  reports say tunnels are often blocked and LLM servers can trip an abuse filter. Corey reads the
  current terms before regular use; the account could be limited or suspended [test this first].
- **Third-party and unmaintained parts.** Profile A's model file is a third-party conversion
  (pinned by commit and sha256). Aider is updated slowly. Unreported bad packages exist.
- **Small context.** The big game files are larger than the helper can read at once.
- **The laptop.** If Windows Update stops installing updates, new holes stay open. Your files
  and browser data are reachable from your account. It shares the home network with Corey's
  server; a guest Wi-Fi network would separate them.
- **Comment mode (optional, off by default).** Aider's `--watch-files` acts on `AI!` comments
  in any file that changes, including files pulled from someone else's branch. A friend's
  comment becomes an instruction to your helper. Only start it after `git pull` has finished,
  never leave it running while pulling [test this first].
- **CI builds branch code (if `loop-check.yml` is used).** The build runs the branch's
  `vite.config.ts` and plugins in GitHub's runner. No secrets and a read-only token limit what
  it can reach, but a malicious change could still misuse that runner's time and network, and a
  green build says nothing about what the code does in a browser.
- **Building on the laptop.** `loop test` runs `npm run build`, which runs the project's own
  config and plugins with your account's rights, like any build.
- **Per-user tools are still you.** Tools installed without admin run with your account's
  rights: they can read and change your files and browser data. A matching hash proves a file
  is what the vendor published, not that the vendor's code is harmless.
- **Hashes from the download page.** If the teen reads a hash from the same page the file came
  from, a tampered page could show a matching tampered hash. Use the hashes in PINS.md.
- **GitHub's reach.** It only sees what you push. Push protection can be bypassed by whoever
  pushes, and it does not know a random key's shape.

## Open questions for Corey

1. A separate named Cloudflare tunnel with its own hostname (never the game's tunnel) would give
   a fixed address and probably streaming, which would allow a tool-calling client that asks
   before each action. Not researched far enough; Aider stays the default.
2. Is a tunnelled model server in a notebook allowed under Kaggle's current terms?
3. Whose Kaggle account runs it day to day, given his age and Kaggle's terms?
4. Store the model in a private Kaggle dataset instead of downloading it each session (not researched).

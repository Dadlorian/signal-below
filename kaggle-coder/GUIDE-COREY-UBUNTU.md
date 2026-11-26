# kaggle-coder: Corey's guide (Ubuntu)

Plain summary: a coding model runs on Kaggle's two T4 GPUs; the son's Windows 11 laptop runs
git, a plain editor and Aider (a terminal coding helper). He pushes to a GitHub repo you own;
nothing reaches `main` or the live game until you approve it. You test everything on your own
Kaggle account first (part F).

**Verdict: needs a look before he uses it.** Nothing here has been run or tested. Items marked
[test this first] are unconfirmed. None of this touches the game's Cloudflare tunnel,
`cloudflared` on this server, or the `signal-below` container.

---

## A. Before you start

- **Kaggle's terms.** Read Kaggle's current Terms and Acceptable Use yourself, or ask Kaggle,
  before regular use. Unconfirmed forum reports say tunnels are often blocked and LLM servers can
  trip an abuse filter. `server.py` only stops itself when idle; it does nothing to keep a
  session alive. If Kaggle blocks it, stop and decide again.
- **His Kaggle account**: own email. If he is 13 to 16, the guardian consent form comes first:
  https://www.kaggle.com/guardian-consent-minor-use. Phone verification may need your number;
  guides say one number per account [test this first].
- **GitHub** needs him to be 13 or older.
- **The laptop**: GUIDE-WINDOWS step 1.

---

## B. The coding-helper key

**Make it** (shown once on screen, kept out of shell history):

```
CODER_KEY=$(openssl rand -hex 32); export CODER_KEY
printf '%s\n' "$CODER_KEY"
```

**It lives in exactly two places**, typed by hand:
1. the Kaggle Secret `CODER_API_KEY` (your account for testing, his account for real use);
2. his Windows user environment variable `AIDER_OPENAI_API_KEY` (GUIDE-WINDOWS step 11).

You keep no copy. Close the terminal when done (`smoke.sh` reads `CODER_KEY` from it first).
Your **Kaggle API token** is a different credential: it gives full control of your Kaggle
account and lives only in `~/.kaggle/access_token`, mode 600 (part F).

**Rotate** weekly, and at once on any leak.

**If a key leaks** (pushed, pasted, shown, or unsure):
1. Stop the Kaggle notebook (the address dies).
2. New coding-helper key: replace the Kaggle Secret and his environment variable.
3. If your Kaggle API token leaked: revoke it at https://www.kaggle.com/settings/api, delete
   `~/.kaggle/access_token`, make a new one.
4. If it was pushed to GitHub: treat it as leaked even after deleting it; rotation (step 2) is the
   real fix. Then clean history: rewrite the branch without the file or line (for example with
   `git filter-repo`) and force-push, and ask GitHub Support to purge cached views if it reached a
   public page [test this first]. Forks and clones made in between keep it.
5. Write down what happened and when. Talk it through with him; nobody is in trouble for telling.

---

## C. GitHub setup (primary path: public repo, you own it)

A **public** repo on the Free plan gets enforced branch protection, secret scanning and CodeQL.
A private Free repo enforces none of these. The checks are advice; the gate is your approval
after part D.

1. **Repo**: public, under your account. **Settings > Collaborators**: invite him (Write, not admin).
2. **His account**: 2-step login; "Keep my email addresses private" and "Block command line
   pushes that expose my email"; username not his real name.
3. **Settings > Branches > branch protection rule for `main`**: require a pull request, 1
   approval; dismiss stale approvals on new commits; require review from Code Owners; require
   approval of the most recent reviewable push; require status check `checks`; do not allow
   bypassing; leave force pushes and deletions blocked.
4. **Settings > Actions > General**: allow only selected actions (`actions/checkout`); require
   actions pinned to a full-length commit SHA; workflow permissions read-only; leave "Allow GitHub
   Actions to create and approve pull requests" off; require approval for fork pull requests.
5. **Settings > Code security**: turn on **Secret scanning** and **Push protection**, Dependabot
   alerts and security updates, and CodeQL default setup.
   - *Secret scanning* (free and automatic on public repos) scans the whole git history on all
     branches for known token formats and raises alerts. Tokens of partner services are reported
     to that service instead of shown to you.
   - *Push protection* blocks a push that contains a known secret format, before it lands.
   - **What they do not catch:** a random key like the coding-helper key (no known shape), a
     tunnel address, anything already copied elsewhere. Anyone with write access can bypass push
     protection by choosing a reason ("false positive", "used in tests", "fix it later"). That is
     why `safety.yml` also looks for the key **names** and `trycloudflare.com` addresses.
6. **Copy into the repo** (your own first pull request):
   `github/workflows/safety.yml` to `.github/workflows/safety.yml`, `github/gitleaks.toml` to
   `.github/gitleaks.toml`, `github/dependabot.yml` to `.github/dependabot.yml`,
   `github/CODEOWNERS` to `.github/CODEOWNERS` (your username in). If the game sits in a
   subfolder, set `GAME_DIR` and Dependabot's `directory`.
7. **His `.gitignore`** (his file: suggest these lines and let him add them, as a lesson):

   ```
   # keys, addresses and helper files must never be committed
   .env
   .env.*
   .aider*
   *.key
   *.pem
   kaggle.json
   access_token
   .kaggle/
   .continue/
   .vscode/
   ```

**What `safety.yml` does** (pull_request only, read-only, no secrets, never installs or starts
his code): fails on any added or changed `.env*`, `.aider*`, `kaggle.json`, `access_token`,
`.kaggle/`, `*.key`, `*.pem` (no exceptions); stops on `.continue/`, `.vscode/`, `.github/`,
`.husky/`, `.gitattributes`, npm config files, `tasks.json`, Replit leftovers; checks
`package.json` lifecycle scripts, `--host` and floating or non-registry versions; checks the
lockfile for registry, integrity and install scripts; stops on `host: true` / `allowedHosts: true`
in `vite.config.*`; `npm audit` on the lockfile only; gitleaks (pinned, hash-checked) with the
rules from `.github/gitleaks.toml` **as on the base branch**, which add: the names
`CODER_API_KEY`, `AIDER_OPENAI_API_KEY`, `OPENAI_API_KEY`, `KAGGLE_API_TOKEN`, `KAGGLE_KEY` or
`access_token` given a value, and any `trycloudflare.com` address. Test it on a throwaway pull
request first [test this first].

**Optional: a local pre-commit check in YOUR clone of the game repo.** It is local only: it is
not pushed, not enforced for him, and `git commit --no-verify` skips it. Do not put it in the
`beta_games` repo (its scanner flags active git hooks).

```
mkdir -p ~/.local/share/gitleaks-8.30.1 && cd ~/.local/share/gitleaks-8.30.1
curl -sSfL -o gl.tgz https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  gl.tgz" | sha256sum -c -
tar -xzf gl.tgz gitleaks && rm gl.tgz
cd ~/code/game-repo     # your own clone
printf '%s\n' '#!/bin/sh' \
  'exec "$HOME/.local/share/gitleaks-8.30.1/gitleaks" git --pre-commit --staged --redact --no-banner --config .github/gitleaks.toml .' \
  > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## D. Review routine (every pull request)

**R1. Hooks-off clone into a new empty folder**

```
PR=12
REPO=https://github.com/corey-github-username-here/game-repo.git
W=$(mktemp -d)
GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null -c core.fsmonitor=false \
  clone --no-checkout --no-recurse-submodules "$REPO" "$W/r"
cd "$W/r"
git config core.hooksPath /dev/null
git config core.fsmonitor false
git fetch origin "pull/$PR/head:pr-$PR"
```

**R2. Path stops.** Any hit: read that file's diff in full first.

```
git diff --name-only "origin/main...pr-$PR" > "$W/changed.txt"
grep -nE '(^|/)\.(env|aider)|(^|/)kaggle\.json$|(^|/)access_token$|\.(key|pem)$' "$W/changed.txt"
grep -nE '(^|/)\.(continue|vscode|github|husky)/|(^|/)\.gitattributes$|(^|/)tasks\.json$' "$W/changed.txt"
grep -nE '(^|/)\.npmrc$' "$W/changed.txt"
grep -nE '(^|/)package\.json$' "$W/changed.txt" && git diff "origin/main...pr-$PR" -- '*package.json'
```

**R3. Read the change.** Commits made by Aider carry "(aider)" in the author name.

```
git log --format='%h %an %s' "origin/main..pr-$PR"
git -c core.pager=cat diff --no-ext-diff --no-textconv "origin/main...pr-$PR"
```

**R4. Zip for the scanner, without letting `.gitattributes` hide files.**

```
printf '* -export-ignore -export-subst\n' > .git/info/attributes
git archive --format=zip --prefix=TOP-FOLDER/ -o /home/projects/beta_games/pr-$PR.zip "pr-$PR"
git ls-tree -r --name-only "pr-$PR" | wc -l
unzip -Z1 /home/projects/beta_games/pr-$PR.zip | grep -v '/$' | wc -l
```

The counts must match. `TOP-FOLDER` matches the layout of his usual zips (`unzip -Z1` one in
`zips/`). Then `/scan-new-zip pr-$PR.zip` as usual (the process is in CLAUDE.md and
UPDATE-INSTRUCTION.md). Approve only after reading the diff with no FAIL in the scan. Then
`rm -rf "$W"`. A zip he sends instead goes straight to `/scan-new-zip`.

---

## E. Pins

`kaggle/PINS.md`: llama.cpp b12318 (both tarballs), cloudflared, model profiles A / A-small / B
(repo commit, file, sha256), uv 0.13.8, Aider 0.86.2, checkout and gitleaks. `server.py` refuses
to start on any `UNPINNED` value or any hash mismatch.

---

## F. Quick launch on YOUR OWN Kaggle account (do this before he does)

Make a key (part B) and add it to **your** Kaggle account as Secret `CODER_API_KEY`.

**Web-UI path (simplest, same as his):**
1. kaggle.com > Create > New Notebook. Keep it **Private** (its log shows the address).
2. Settings: Accelerator **GPU T4 x2**, Internet **On**. Add-ons > Secrets: tick `CODER_API_KEY`.
3. Paste all of `kaggle/server.py` into one cell. Run.
4. Read the output: every `sha256 ok`; `using profile A` and the MiB values; GPU memory used on
   **both** GPUs; `key check passed`; the tool-call line and the `Chat format` line (write both
   down); then the address.

**Command-line path (needs a Kaggle API token = full control of your Kaggle account):**
1. Install the CLI: `pipx install kaggle` [test this first].
2. Log in, one of:
   - `kaggle auth login` (browser sign-in), or
   - token from https://www.kaggle.com/settings/api, kept out of shell history:
     `read -rs KAGGLE_API_TOKEN; export KAGGLE_API_TOKEN`, or
   - that token saved as `~/.kaggle/access_token`, then `chmod 600 ~/.kaggle/access_token`.
3. Edit `kaggle/kernel-metadata.json`: replace `corey-kaggle-username`. Keep `"is_private": true`.
4. `kaggle kernels push -p kaggle-coder/kaggle --accelerator NvidiaTeslaT4`
5. Secrets cannot be attached from the CLI: on kaggle.com open the notebook, Add-ons > Secrets,
   tick `CODER_API_KEY`, then run it again from the page [test this first: whether a pushed
   script can read the secret; if not, use the web-UI path].
6. `kaggle kernels status corey-kaggle-username/kaggle-coder` until running; read the address from
   the run's log on the page [test this first: `kaggle kernels output` while running].
7. Stop it from the page (no CLI stop command is documented).
8. After testing, revoke the token at the settings page and delete `~/.kaggle/access_token`.

Profile B: set `PROFILE = "B"` at the top of the cell (or `KC_PROFILE=B`) and repeat.
After stopping: start again and check the old address is dead and a new one appears.

---

## G. Smoke test (every new address, before use)

```
bash kaggle-coder/tests/smoke.sh https://some-random-words.trycloudflare.com
```

The key comes from `CODER_KEY` in your terminal (part B) or a hidden prompt; it is never an
argument. Checks: `/health`; no key gives 401 on models and chat; `/`, `/index.html`, `/props`,
`/slots`, `/metrics` are not open; with the key the model is `kaggle-coder`; a `stream:false`
chat answers; a tool call (information only); a ~12k-token prompt with an ~800-token answer
finishes in under 100 seconds. Any FAIL: stop the session and do not use that address. Passing
means no indicators found by these checks; it cannot show the key has stayed secret.

If the large prompt fails with 524 or 100+ seconds: Cloudflare gives up after about 125 seconds
without a first byte [test this first for quick tunnels]. Lower `max_tokens` in
`aider/model.settings.yml`, try profile B, or keep tasks smaller.

---

## H. Aider test on Ubuntu (before the laptop)

Install the same version: `uv tool install --python 3.12 --exclude-newer 2026-02-13 aider-chat==0.86.2`.
Copy the `aider/` files to your home folder with the names in GUIDE-WINDOWS step 10. In a
throwaway git repo (never the game repo), with `read -rs AIDER_OPENAI_API_KEY; export AIDER_OPENAI_API_KEY`:

```
aider --config ~/.aider.conf.yml --env-file ~/.aider-empty.txt --load ~/.aider-empty.txt \
  --model-settings-file ~/.aider.model.settings.yml --model-metadata-file ~/.aider.model.metadata.json \
  --aiderignore ~/.aiderignore-signal --read ~/.aider-conventions.md \
  --openai-api-base "https://some-random-words.trycloudflare.com/v1" \
  --model openai/kaggle-coder --weak-model openai/kaggle-coder --editor-model openai/kaggle-coder \
  --architect --no-auto-accept-architect --no-stream --no-auto-lint --no-auto-test \
  --no-suggest-shell-commands --no-notifications --no-watch-files --no-detect-urls \
  --no-check-update --analytics-disable --disable-playwright
```

Check: answers arrive without streaming; `/ask`, then an edit shows "Edit the files?", and
answering **n** writes nothing and makes no commit; `/diff`, `/undo` work; it runs no command;
whether `/v1` is needed on the address. **Decoy test:** put a `.env` with
`OPENAI_API_BASE=http://127.0.0.1:9`, a `.aider.conf.yml` with a `lint-cmd`, and a
`.aider.model.settings.yml` with `extra_headers` in the throwaway repo; confirm none is used
(llama-server log, no lint run). On the laptop, also confirm `start-helper` refuses to start in
that decoy folder. Try `/add` on a copy of a 2,700-line file and note what happens.
**Watch-mode decoy** (only if comment mode is ever wanted): see part L. Also check that
`start-helper <address> ask` refuses edits even when you ask it to change a file.

---

## I. PROPOSAL: possible edits to security-scan.sh (not made)

1. Flag `.git/`, `.vscode/`, `.continue/`, `.github/`, `.husky/`, `.gitattributes`, `.env*` or
   `.aider*` entries inside a root zip as needs-a-look.
2. Flag `.vscode/tasks.json` with `"runOn": "folderOpen"` as FAIL.
3. Flag any `trycloudflare.com` address and the key names from `github/gitleaks.toml` in his code.
4. Check that a `git archive` zip's file count matches the tree (R4).
5. The next scan also reads this `kaggle-coder/` folder (scripts, a `.cmd` launcher, workflow
   text). Add allowlist lines only after reading each hit.
6. `.github/workflows/safety.yml` will appear in R4 zips under check [18]; decide whether to
   accept it in `scan/allowlist.txt`.

---

## J. First run checklist (Ubuntu)

1. Read Kaggle's current terms (part A).
2. Read `kaggle/PINS.md` and the diff of `kaggle/server.py`.
3. Make a key (part B); add it as Secret `CODER_API_KEY` on your own Kaggle account.
4. Private notebook, GPU T4 x2, Internet on, paste `server.py`, Run (part F).
5. Check: all sha256 ok, profile A, both GPUs used, key check passed; note tool-call and Chat format lines.
6. `bash kaggle-coder/tests/smoke.sh <address>`: everything PASS, large prompt under 100 s.
7. Aider test and decoy test on a throwaway repo (part H).
8. Repeat 4 to 7 with `PROFILE = "B"`.
9. Stop the session; restart; old address dead, new one works; key file gone with the session.
10. Set up GitHub (part C) and test `safety.yml` on a throwaway pull request; only then the laptop.

---

## L. THE LOOP (teen workflow) and the loop-check template

**Install on the laptop:** copy `loop/loop.cmd` to `%USERPROFILE%\.local\bin\loop.cmd`, next to
`start-helper.cmd` (that folder is already on his Path, GUIDE-WINDOWS step 9). It is a plain
`.cmd` file, so PowerShell's execution policy does not block it and it needs no admin. Read it
first: it is commented for him to read too. It could not be run where it was written; test every
command once on the laptop on a throwaway branch [test this first]. `start-helper.cmd` gained an
optional second word `ask` (`--chat-mode ask`, ask-only) used by `loop design`; the mode setting
moved out of `.aider.conf.yml` into the launcher, so recopy both files.

What `loop` does and does not do: it runs only its own `git` / `npm` / `start-helper` commands
and prints each one first; never a command the AI suggested; never `npm install`; `loop setup` is
`npm ci --ignore-scripts` and refuses when the package files differ from `origin/main`; `loop
test` builds on the laptop (that runs his own `vite.config.ts` and plugins, as any build does) and
previews with Vite's `preview` on `127.0.0.1` (never `npm run dev`, which runs Vite with `--host`);
`loop push` refuses on `main` and when key files, key names or a tunnel address are staged. Its
plan notes go in `ideas\` at the repo root, **not** `docs\`: `deploy/Dockerfile` copies `docs/`
onto the live site.

**Branch protection on `main`** (part C.3) is what makes the loop work for friends: they push
branches, cannot push to `main`, cannot merge.

**Collaborators vs forks.** Collaborators (Write) push branches to your repo: simplest for
teens, the checks run with a read-only token, but every collaborator can push any branch name
and can bypass push protection with a reason. Forks keep friends out of your repo entirely
(fork pull requests need your approval before checks run, part C.4) but add a fork, a second
remote and "sync fork" to their day. Start with collaborators for people you know; use forks for
anyone else.

**CI template.** `github/workflows/loop-check.yml` is a template, not live. Copy it to
`.github/workflows/loop-check.yml` in the game repo only after branch protection and CODEOWNERS
are set, and then **remove `safety.yml`** and change the required checks to `static` and
`build`: loop-check is the superset (every safety.yml check, two made diff-based, plus Rule 2
and a build), so running both would repeat the same work. Be clear what the build means: job
`build` runs `npm ci --ignore-scripts` and `npm run build` **in GitHub's runner**, which executes
the branch's `vite.config.ts` and its plugins there. It has no secrets, a read-only token, no
cache, and it only starts after job `static` passed. It never runs on this server.

**Heads-up on both templates:** the game's `package.json` `dev` script runs Vite with `--host`.
`safety.yml` fails on any `--host` script, so as written it is red on every pull request until
you decide (ask him to change the script as a lesson, or accept it). `loop-check.yml` fails only
when a pull request adds or changes such a script.

**Optional editor extras** (none tested; the terminal is the supported way):
- `vscodium/user-tasks.json`: paste via *Tasks: Open User Tasks*. User-level tasks exist in VS
  Code (shell/process only); VSCodium support and `${input:...}` there are [test this first].
  Never put a `tasks.json` in the game repo's `.vscode/`; keep `task.allowAutomaticTasks` off.
- Comment mode (`--watch-files`): only by hand, with every start-helper switch plus
  `--watch-files`, only after `git pull` has finished. Add to the part H decoy test: pull a
  branch whose file contains a comment ending in `AI!` while watch mode runs, and record whether
  it acts on it and whether "Edit the files?" still appears [test this first].

---

## K. What these checks cannot rule out

See SAFETY-BRIDGE.md, last two sections: a "yes" given without reading, tricked answers, the key
being readable by programs on the laptop, the public tunnel address, Kaggle's terms, third-party
and slowly maintained parts, small context, and anything not yet tested on the real machines.

# kaggle-coder

A free coding helper for The Signal Below. A Qwen coding model runs on Kaggle's two T4 GPUs
(llama.cpp `llama-server`). The son's Windows 11 laptop runs git, a plain editor and **Aider**,
a terminal coding helper, which talks to the model through a temporary Cloudflare address. His
code goes to GitHub as pull requests; Corey approves them before anything goes live.

```
laptop: Aider 0.86.2 via start-helper (no streaming, asks before writing, never runs commands)
   |  HTTPS, key required
   v
https://<random-words>.trycloudflare.com          (new address every session)
   |
   v
Kaggle notebook (private): cloudflared -> llama-server on 127.0.0.1:8080
                           -> Qwen3-Coder-30B-A3B (profile A) or Qwen2.5-Coder-14B (profile B), split over 2x T4

laptop --push--> GitHub pull request --checks + Corey's approval--> main
                                      --Corey's Ubuntu review + scanner--> live game
```

**Status: needs a look before he uses it.** Nothing here has been run or tested. Corey tests it
on his own Kaggle account first (GUIDE-COREY-UBUNTU, part J). Lines marked **[test this first]**
are unconfirmed.

## The 3 rules

1. **Plan first, read, then say yes.** `/ask` for a plan, read it, and only then let the helper
   edit. Read `/diff` after. Nothing gets run, installed or downloaded because the helper said
   so; new packages, downloads, zips and commands go to Corey (card in SAFETY-BRIDGE.md).
2. **Keys never reach GitHub.** The helper key lives only in the Kaggle Secret
   `CODER_API_KEY` and your Windows account setting `AIDER_OPENAI_API_KEY`. Never in the game
   folder, a commit, a chat, a screenshot or a note. If one leaks, tell Corey at once.
3. **Only your own address, and switch it off.** Use only the address your own private Kaggle
   notebook printed. Stop the Kaggle session when you finish.

## Where to go

| Who | Read |
|---|---|
| Son and friends: the daily 5-step loop | [loop/LOOP.md](loop/LOOP.md) |
| Son (Windows 11) setup | [GUIDE-WINDOWS.md](GUIDE-WINDOWS.md) |
| Corey (Ubuntu): key, GitHub, review, testing on his own Kaggle account | [GUIDE-COREY-UBUNTU.md](GUIDE-COREY-UBUNTU.md) |
| Both: the layers, where keys live, the leak routine, the card to print | [SAFETY-BRIDGE.md](SAFETY-BRIDGE.md) |
| Versions and hashes | [kaggle/PINS.md](kaggle/PINS.md) |

## Files

| File | What it is |
|---|---|
| `kaggle/server.py` | Paste into a private Kaggle notebook: picks a model profile, checks pins and key, downloads and sha256-checks everything, starts llama-server, proves requests without the key get 401, opens the tunnel, prints only the address, stops itself when idle |
| `kaggle/kernel-metadata.json` | For Corey's optional command-line launch on his own account |
| `kaggle/PINS.md` | Exact versions, commits and sha256 values |
| `aider/` | Corey's Aider settings and the `start-helper.cmd` launcher (normal or `ask` mode) for the laptop's home folder |
| `loop/loop.cmd`, `loop/LOOP.md` | THE LOOP: `loop idea / design / code / test / push` (+ `setup`, `status`, `undo`, `help`), one page of docs |
| `vscodium/` | Plain-editor safety settings (no extensions allowed); optional `user-tasks.json` for the Run Task menu |
| `github/` | Pull-request checks (`safety.yml`, or the superset `loop-check.yml` that also builds), gitleaks rules, Dependabot, CODEOWNERS for the game repo |
| `tests/smoke.sh` | Corey's check of a new address (key from the environment or a hidden prompt) |
| `continue/` | **Parked, not in use** (earlier client draft) |

Everything used is free. llama.cpp, cloudflared, the Qwen models (Apache-2.0), Aider
(Apache-2.0), uv, VSCodium and gitleaks are open source. Kaggle, Cloudflare and GitHub are free
services, not open source.

Passing every check here means "no indicators found by these checks", not "harmless". What the
checks cannot rule out is listed at the end of SAFETY-BRIDGE.md.

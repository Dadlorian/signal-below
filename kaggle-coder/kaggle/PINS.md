# Pins

Every download is pinned to an exact version (or commit) and checked by sha256. Values here must
match `kaggle/server.py`, `github/workflows/safety.yml` and the guides. Any value that says
`UNPINNED - Corey must fill in` stops `server.py`.

Looked up on 2026-11-26 from official metadata only: GitHub releases API (`digest` field),
Hugging Face API (`lfs.sha256` of each file), PyPI JSON API, Open VSX API. Nothing was
downloaded and nothing was tested. Releases were chosen at least two weeks old where possible.

## Kaggle side: runtime and tunnel (used by server.py)

| What | Pin | sha256 |
|---|---|---|
| llama.cpp build | `b12318`, published 2026-11-12, commit `7021f7e0993c2bae3860a9b7e6507bead16c90af` | |
| llama.cpp asset | `llama-b12318-bin-ubuntu-cuda-12.8-x64.tar.gz` (197,999,267 bytes) | `e5c7ec6d5924059d6222cfad3b266d88fafdb3772700e23f8b0d23f7d68ce797` |
| CUDA runtime asset | `cudart-llama-b12318-bin-ubuntu-cuda-12.8-x64.tar.gz` (594,371,580 bytes) | `caec3617f1fd440b85b80f0c2db031ef483f383a1939c684f0476d1d3086caea` |
| cloudflared | `2026.11.0`, published 2026-11-12, `cloudflared-linux-amd64` (40,283,099 bytes); also matches the release-notes checksum list | `51f7c68b57ed7269164075d7e789efce5b59355982f06392deeb037d982a51fd` |

[test this first] that build b12318 runs on Kaggle's T4 driver (CUDA 12.8 runtime, T4 is compute
capability 7.5). If not: build from source with `-DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=75`.
The new "v1.1.0" release has no Linux CUDA files; numbered builds are marked pre-release but carry them.

## Model profiles (used by server.py; never `-hf`, never auto-pull)

`server.py` picks **A** when nvidia-smi shows 2 GPUs with at least 15,000 MiB each, otherwise **B**.
Set `PROFILE` in the notebook cell to force one. Download URL form:
`https://huggingface.co/<repo>/resolve/<commit>/<file>`.

| Profile | Repo @ commit | File (bytes) | sha256 | Licence | Server flags |
|---|---|---|---|---|---|
| A | `unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF` @ `b17cb02dd882d5b6ab62fc777ad2995f19668350` (third-party quantisation of `Qwen/Qwen3-Coder-30B-A3B-Instruct`) | `Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf` (18,556,689,568) | `fadc3e5f8d42bf7e894a785b05082e47daee4df26680389817e2093056f088ad` | apache-2.0 | `-c 16384`, `--temp 0.7 --top-p 0.8 --top-k 20 --repeat-penalty 1.05` |
| A-small | same repo @ same commit | `Qwen3-Coder-30B-A3B-Instruct-UD-Q3_K_XL.gguf` (13,806,312,608) | `69cd7578d77dffc0b17e34bad9ef998d08ae0e20ccceef21bad4e7eb3d8c553b` | apache-2.0 | same as A |
| B | `Qwen/Qwen2.5-Coder-14B-Instruct-GGUF` @ `d0a692ef765eefbf2fabb130b3cb2e8917e3d225` (official) | `qwen2.5-coder-14b-instruct-q4_k_m.gguf` (8,988,110,272; single file) | `c1e659736d89ac1065fb495330fb824d94001974a4bfa78e7270e43476a8d940` | apache-2.0 | `-c 16384`, sampling at server defaults [test this first] |

Flags for every profile: `--alias kaggle-coder --host 127.0.0.1 --port 8080 --api-key-file <tmp file>
--no-webui --no-slots --no-mmproj --offline --jinja -ngl all -sm layer -ts 1,1 -np 1 -n 1024
--no-context-shift`. All flags exist in the b12318 README; values are starting points, not tested.
Never add `--tools`, `--agent`, `--mcp-servers-*`, `--ui-mcp-proxy`, `--props` or `--metrics`.

Later option (not researched): keep the model in a **private Kaggle dataset** so it is not
downloaded every session (profile A is 18.6 GB each time).

## Laptop side

| What | Pin | sha256 |
|---|---|---|
| uv (installs Aider) | `0.13.8`, published 2026-11-12, `uv-x86_64-pc-windows-msvc.zip` (15,529,884 bytes) | `529e78a9cec6cd7e3e014f7ecd8bda0c113969d4ed0f2efeedb85c30943325b8` |
| Aider | `aider-chat==0.86.2` on PyPI, uploaded 2026-02-12, Apache-2.0, needs Python 3.10-3.12; all 301 of its dependencies are pinned with `==` (including `litellm==1.81.10`, `openai==2.20.0`) | wheel `aider_chat-0.86.2-py3-none-any.whl`: `64f6a0c66c9f4633ad9f479bca3e64ebcba02b9da03c6b604b74a44736b2416e` |
| VSCodium (plain editor, optional) | user installer from the VSCodium GitHub releases page, 1.96 or newer | Corey compares the `.sha256` file published next to it |
| Python for Aider | uv-managed CPython 3.12 (`--python 3.12`) | `UNPINNED - Corey must fill in` if an exact patch version is wanted (uv picks one) |

Install command (Corey, on the laptop, as the son's user):
`uv tool install --python 3.12 --exclude-newer 2026-02-13 aider-chat==0.86.2`
(`--exclude-newer` keeps any loose dependency to files uploaded before that date [test this first]).
Do **not** use `aider-install`: it always installs `aider-chat@latest`.

## Windows tools (no admin; used by SETUP-NO-ADMIN.md and loop/setup-tools.cmd)

All install per-user into `%LOCALAPPDATA%\kc-tools`. Picked at least two weeks old. Hashes are
read from the vendor's own metadata (column "Hash read from"), never from a blog or chat.

| Tool | Version, date | File and official URL | sha256 | Hash read from |
|---|---|---|---|---|
| VS Code (portable ZIP) | 1.146.0, 2026-11-10 | `VSCode-win32-x64-1.146.0.zip` from `https://vscode.download.prss.microsoft.com/dbazure/download/stable/69047191fc427f2f92828279aae1d90d8eeda7ab/VSCode-win32-x64-1.146.0.zip` | `0d47f5bbff72499c6a4a92f6d72dd8cc5ba4606185f624465032626614119d61` | `sha256hash` field of `https://update.code.visualstudio.com/api/versions/1.146.0/win32-x64-archive/stable` |
| VS Code user installer (alternative) | 1.146.0 | `VSCodeUserSetup-x64-1.146.0.exe` from `https://vscode.download.prss.microsoft.com/dbazure/download/stable/69047191fc427f2f92828279aae1d90d8eeda7ab/VSCodeUserSetup-x64-1.146.0.exe` | `da5aad5fd88244ffc35d5f6c86c5214f9ceed6520888e4c5ccf3e8678e5bbf0a` | same API, platform `win32-x64-user` |
| Git for Windows, PortableGit | 2.56.1 (`v2.56.1.windows.1`), 2026-11-10 | `PortableGit-2.56.1-64-bit.7z.exe` from `https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/PortableGit-2.56.1-64-bit.7z.exe` | `9dd04a608ceb5f6ab32a73709e0ecb159d211da71b697c45ff81f6dd0c6b49c7` | GitHub releases API `digest` of that asset |
| Node.js (ZIP) | 26.13.1 "Lithium" LTS, 2026-11-10 | `node-v26.13.1-win-x64.zip` from `https://nodejs.org/dist/v26.13.1/node-v26.13.1-win-x64.zip` | `e2edda75bfb089654705cf65a13b58933bfd5f57148e8ebda916f58a2474f1f7` | `https://nodejs.org/dist/v26.13.1/SHASUMS256.txt` (LTS line from `https://nodejs.org/dist/index.json`) |
| uv (for Aider) | 0.13.8, 2026-11-12 | `uv-x86_64-pc-windows-msvc.zip` from `https://github.com/astral-sh/uv/releases/download/0.13.8/uv-x86_64-pc-windows-msvc.zip` | `529e78a9cec6cd7e3e014f7ecd8bda0c113969d4ed0f2efeedb85c30943325b8` | GitHub releases API `digest` |
| Cline (VS Code extension, optional) | 4.1.26, 2026-10-26, publisher `saoudrizwan`, id `saoudrizwan.claude-dev`, Apache-2.0 | `cline-4.1.26.vsix` from `https://github.com/cline/cline/releases/download/v4.1.26/cline-4.1.26.vsix` | `d8ea4c3505052c48e7c7a5558e7213a53827b6ba1da7e56513c87d896df51c4d` | GitHub releases API `digest` [test this first: that this VSIX is the same build as the Marketplace's 4.1.26] |

Why PortableGit and not MinGit: Git for Windows describes MinGit as "an intentionally minimal,
non-interactive distribution" for other applications (gitforwindows.org/mingit.html), and it
leaves out help and interactive commands. PortableGit is the full Git for Windows without an
installer. It is a self-extracting 7-Zip `.exe`; `setup-tools.cmd` first tries Windows' own
`tar.exe` on it and otherwise asks the teen to double-click it and pick the folder
[test this first]. Windows ships `curl.exe` and `tar.exe` (bsdtar, libarchive) since Windows 10
build 17063 (Microsoft "Tar and Curl Come to Windows!").

## GitHub Actions (safety.yml / loop-check.yml) and local pre-commit

| What | Pin | sha256 |
|---|---|---|
| actions/checkout | `v7.0.1` = commit `3d3c42e5aac5ba805825da76410c181273ba90b1` | n/a (pinned by commit) |
| gitleaks | `v8.30.1` (2026-03-21), `gitleaks_8.30.1_linux_x64.tar.gz` | `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` |
| actions/setup-node (loop-check.yml only) | `v7.1.0` (2026-10-08) = commit `949feb2413d6458794dcd2491c4babbbce0c15c1`, `package-manager-cache: false` | n/a (pinned by commit) |
| Node.js in CI (loop-check.yml only) | `26.13.1` (2026-11-10), line 26 "Lithium", Active LTS since 2026-10-28 per nodejs/Release `schedule.json`; from nodejs.org `dist/index.json` | setup-node downloads and checks it [test this first] |

## Not planned

- **Laptop CPU fallback model.** 8 GB RAM is not enough for these models. (Research notes kept:
  llama.cpp's single Windows CPU zip carries several CPU variants: x64, sse42, sandybridge
  (AVX), haswell (AVX2) and newer.)
- **Continue** (parked in `continue/`): final stable is 2.0.0; 2.1.0 on Open VSX is the
  pre-release channel; the repo says it is read-only. Open VSX's `.sha256` for 2.0.0 was empty.

## Changing a pin

1. Pick a release at least two weeks old. Read its release notes.
2. Copy the asset name and sha256 from the release page or API (for models: the file page or
   the API at an exact commit), never from a blog or chat.
3. Change the value here and in the file that uses it, in the same pull request.
4. Corey reads the diff before anyone runs it.

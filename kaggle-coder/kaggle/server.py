#!/usr/bin/env python3
"""kaggle-coder: a private coding-model server on Kaggle's two T4 GPUs.

Requirements (kept word for word from the stub):
  1. Refuse to start while any pin is unfilled ("UNPINNED - Corey must fill in").
  2. Read the API key from Kaggle Secrets (label CODER_API_KEY) with
     kaggle_secrets.UserSecretsClient. Refuse if missing or shorter than 32 characters.
     [test this first] whether UserSecretsClient works in a CLI-pushed script; it is
     documented for the notebook editor. Notebook-cell use (web-UI path): paste the whole
     file into one cell; Add-ons > Secrets > tick CODER_API_KEY for that notebook.
  3. Download the pinned runtime, cloudflared and model files; check every sha256 against
     PINS.md; refuse on any mismatch. Use an exact model file, never "first file in repo".
  4. Server listens on 127.0.0.1 only, explicit port, key required, no web UI, no extra
     monitoring endpoints. If the runtime has no built-in key check (Ollama has none as far
     as checked), a reviewed local key-checking proxy sits in front of it.
  5. Before the tunnel opens: a request WITHOUT the key must get 401. Otherwise stop.
  6. Print only the tunnel address and model name. Never print the key.
  7. Keep-alive loop, stop by itself after a few hours, clean up the key file.
  8. Child processes get a minimal environment, not the notebook's.
  (Changed after the Kaggle-policy review: the loop only watches the processes and stops
  them after MAX_HOURS or IDLE_MINUTES without requests. It does nothing to keep an idle
  session alive.)

KEEP THIS NOTEBOOK PRIVATE. Its output log contains the tunnel address. The address alone
is not enough to use the model (the key is also needed), but it should not be public.

Runtime: llama.cpp llama-server (prebuilt CUDA 12.8 build). Model: one row of PROFILES,
picked from what nvidia-smi reports, or forced with PROFILE below.
Nothing here runs model output. Nothing here has been tested yet.
"""

import atexit
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------------------
# Settings that are not secret. Change them in the notebook cell if needed.
# ---------------------------------------------------------------------------------------
PROFILE = os.environ.get("KC_PROFILE", "auto")   # "auto", "A", "A-small" or "B"
MODE = "tunnel"            # "tunnel" (normal) or "notebook" (no tunnel: chat with ask("...") here)
SECRET_LABEL = "CODER_API_KEY"
MIN_KEY_LEN = 32
MODEL_ALIAS = "kaggle-coder"
PORT = 8080                 # always passed; the README default at this build is 9931
MAX_OUTPUT_TOKENS = 1024    # server-side cap (-n); the default would be "no limit"
MAX_HOURS = 3.0
IDLE_MINUTES = 30           # stop when the server log has not grown for this long [test this first]
MIN_MIB_FOR_A = 15000       # each GPU must report at least this much (a T4 reports a bit under 16 GiB)
WORKDIR = os.environ.get("KC_WORKDIR", "/tmp/kaggle-coder")  # outside /kaggle/working, so it is not saved as output
BASE = "http://127.0.0.1:%d" % PORT

# ---------------------------------------------------------------------------------------
# PINS. Keep in step with PINS.md. Any value containing "UNPINNED" stops the script.
# Read from the GitHub releases API and the Hugging Face API on 2026-11-26 (metadata only).
# ---------------------------------------------------------------------------------------
PINS = {
    # llama.cpp build b12318 (2026-11-12), commit 7021f7e0993c2bae3860a9b7e6507bead16c90af
    "llama_url": "https://github.com/ggml-org/llama.cpp/releases/download/b12318/"
                 "llama-b12318-bin-ubuntu-cuda-12.8-x64.tar.gz",
    "llama_sha256": "e5c7ec6d5924059d6222cfad3b266d88fafdb3772700e23f8b0d23f7d68ce797",
    "cudart_url": "https://github.com/ggml-org/llama.cpp/releases/download/b12318/"
                  "cudart-llama-b12318-bin-ubuntu-cuda-12.8-x64.tar.gz",
    "cudart_sha256": "caec3617f1fd440b85b80f0c2db031ef483f383a1939c684f0476d1d3086caea",
    # cloudflared 2026.11.0 (2026-11-12)
    "cloudflared_url": "https://github.com/cloudflare/cloudflared/releases/download/2026.11.0/"
                       "cloudflared-linux-amd64",
    "cloudflared_sha256": "51f7c68b57ed7269164075d7e789efce5b59355982f06392deeb037d982a51fd",
}

QWEN3_SAMPLING = ["--temp", "0.7", "--top-p", "0.8", "--top-k", "20", "--repeat-penalty", "1.05"]

PROFILES = {
    # A: Qwen3-Coder-30B-A3B-Instruct, Q4_K_M, needs both T4s. Third-party quantisation
    # (unsloth), pinned to repo commit b17cb02dd882d5b6ab62fc777ad2995f19668350.
    "A": {
        "url": "https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/"
               "b17cb02dd882d5b6ab62fc777ad2995f19668350/Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf",
        "sha256": "fadc3e5f8d42bf7e894a785b05082e47daee4df26680389817e2093056f088ad",
        "size": 18556689568,
        "ctx": 16384,
        "flags": QWEN3_SAMPLING,
    },
    # A-small: same model and commit, UD-Q3_K_XL, if A runs out of GPU memory.
    "A-small": {
        "url": "https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/"
               "b17cb02dd882d5b6ab62fc777ad2995f19668350/Qwen3-Coder-30B-A3B-Instruct-UD-Q3_K_XL.gguf",
        "sha256": "69cd7578d77dffc0b17e34bad9ef998d08ae0e20ccceef21bad4e7eb3d8c553b",
        "size": 13806312608,
        "ctx": 16384,
        "flags": QWEN3_SAMPLING,
    },
    # B: Qwen2.5-Coder-14B-Instruct, Q4_K_M, official Qwen repo, single file,
    # pinned to repo commit d0a692ef765eefbf2fabb130b3cb2e8917e3d225. Sampling left at
    # server defaults [test this first].
    "B": {
        "url": "https://huggingface.co/Qwen/Qwen2.5-Coder-14B-Instruct-GGUF/resolve/"
               "d0a692ef765eefbf2fabb130b3cb2e8917e3d225/qwen2.5-coder-14b-instruct-q4_k_m.gguf",
        "sha256": "c1e659736d89ac1065fb495330fb824d94001974a4bfa78e7270e43476a8d940",
        "size": 8988110272,
        "ctx": 16384,
        "flags": [],
    },
}

_cleanup_paths = []
_procs = []


def say(msg):
    print("[kaggle-coder] " + msg, flush=True)


def stop(msg):
    shutdown()
    say("STOPPED: " + msg)
    sys.exit(1)


def shutdown(*_):
    for p in _procs:
        if p.poll() is None:
            p.terminate()
    for p in _procs:
        try:
            p.wait(timeout=20)
        except subprocess.TimeoutExpired:
            p.kill()
    for path in _cleanup_paths:
        try:
            os.remove(path)
        except OSError:
            pass


atexit.register(shutdown)


# ----------------------------------------------------------------------- step 1: pins
def check_pins(profile):
    values = dict(PINS)
    values.update({"model_url": profile["url"], "model_sha256": profile["sha256"]})
    bad = [k for k, v in values.items() if "UNPINNED" in v or not v.strip()]
    if bad:
        stop("these pins are not filled in: " + ", ".join(bad) + ". See PINS.md.")
    for k, v in values.items():
        if k.endswith("_sha256") and not re.fullmatch(r"[0-9a-f]{64}", v):
            stop("pin %s is not a 64-character lowercase sha256." % k)
        if k.endswith("_url") and not v.startswith("https://"):
            stop("pin %s must be an https:// address." % k)


def gpu_mib():
    try:
        out = subprocess.run(["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
                             capture_output=True, text=True, timeout=30).stdout
        return [int(x) for x in out.split() if x.strip().isdigit()]
    except (OSError, subprocess.SubprocessError):
        return []


def choose_profile():
    mib = gpu_mib()
    say("nvidia-smi reports GPU memory (MiB): %s" % (mib or "no GPU found"))
    if not mib:
        stop("no GPU. Settings > Accelerator > GPU T4 x2 (needs a phone-verified account).")
    if PROFILE != "auto":
        if PROFILE not in PROFILES:
            stop("PROFILE must be auto, A, A-small or B.")
        name = PROFILE
    elif len(mib) >= 2 and min(mib) >= MIN_MIB_FOR_A:
        name = "A"
    else:
        name = "B"
    say("using profile %s" % name)
    return name, PROFILES[name]


# ------------------------------------------------------------------------ step 2: key
def read_key():
    try:
        from kaggle_secrets import UserSecretsClient  # only exists on Kaggle
    except ImportError:
        stop("kaggle_secrets is not available. This script only runs on Kaggle.")
    try:
        value = UserSecretsClient().get_secret(SECRET_LABEL)
    except Exception:  # noqa: BLE001 - any failure means no key
        value = None
    if not value:
        stop("no Kaggle Secret named %s is attached to this notebook "
             "(Add-ons > Secrets, then tick it)." % SECRET_LABEL)
    value = value.strip()
    if len(value) < MIN_KEY_LEN:
        stop("the key is shorter than %d characters. Make a new one (GUIDE-COREY-UBUNTU.md, part B)." % MIN_KEY_LEN)
    if re.search(r"[\s,#]", value):
        stop("the key contains spaces, commas or '#'. Make a new one.")
    return value


# ------------------------------------------------------------------ step 3: downloads
def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url, dest, want_sha256, want_size=None):
    """Stream to dest.part, hash while writing, keep only on an exact match."""
    if os.path.exists(dest) and sha256_of(dest) == want_sha256:
        say("already have %s (sha256 ok)" % os.path.basename(dest))
        return dest
    part = dest + ".part"
    say("downloading %s ..." % os.path.basename(dest))
    h = hashlib.sha256()
    size = 0
    req = urllib.request.Request(url, headers={"User-Agent": "kaggle-coder"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(part, "wb") as f:
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                h.update(chunk)
                f.write(chunk)
                size += len(chunk)
    except (urllib.error.URLError, OSError) as e:
        stop("download failed for %s: %s (is Internet on in notebook Settings?)" % (os.path.basename(dest), e))
    if h.hexdigest() != want_sha256 or (want_size and size != want_size):
        os.remove(part)
        stop("sha256 or size mismatch for %s. Do not work around this; tell Corey." % os.path.basename(dest))
    os.replace(part, dest)
    say("sha256 ok: %s" % os.path.basename(dest))
    return dest


def extract(tar_path, into):
    """Extract a .tar.gz without letting any entry escape the target folder."""
    os.makedirs(into, exist_ok=True)
    root = os.path.realpath(into)
    with tarfile.open(tar_path, "r:gz") as t:
        if hasattr(tarfile, "data_filter"):
            t.extractall(into, filter="data")
            return
        for m in t.getmembers():
            target = os.path.realpath(os.path.join(into, m.name))
            if not target.startswith(root + os.sep) or m.isdev():
                stop("unexpected path in %s: %s" % (os.path.basename(tar_path), m.name))
            if (m.issym() or m.islnk()) and not os.path.realpath(
                    os.path.join(os.path.dirname(target), m.linkname)).startswith(root + os.sep):
                stop("link points outside the folder in %s: %s" % (os.path.basename(tar_path), m.name))
        t.extractall(into)


def find_file(top, name):
    for d, _, files in os.walk(top):
        if name in files:
            return os.path.join(d, name)
    return None


def lib_dirs(*tops):
    dirs = []
    for top in tops:
        for d, _, files in os.walk(top):
            if any(".so" in f for f in files) and d not in dirs:
                dirs.append(d)
    return dirs


# -------------------------------------------------------------------- HTTP helpers
def http(path, key=None, method="GET", payload=None, timeout=10):
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = "Bearer " + key
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except (urllib.error.URLError, OSError):
        return None, b""


def clean_env(extra):
    """Child processes get a minimal environment, not the notebook's."""
    env = {k: os.environ[k] for k in ("PATH", "HOME", "LANG", "CUDA_VISIBLE_DEVICES") if k in os.environ}
    env.update(extra)
    return env


def tail_scrubbed(path, key, n=30):
    try:
        with open(path, "r", errors="replace") as f:
            lines = f.readlines()[-n:]
    except OSError:
        return ""
    return "".join(lines).replace(key, "[key hidden]")


def ask(question, max_tokens=800):
    """Notebook mode only: one question to the local server, answer printed as text.
    Nothing in the answer is run."""
    with open(os.path.join(WORKDIR, "api-keys.txt")) as f:
        k = f.readline().strip()
    status, body = http("/v1/chat/completions", key=k, method="POST", timeout=600, payload={
        "model": MODEL_ALIAS, "stream": False, "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": question}]})
    if status != 200:
        print("server answered %s" % status)
        return
    print(json.loads(body)["choices"][0]["message"]["content"])


# ---------------------------------------------------------------------------- main
def main():
    name, profile = choose_profile()
    check_pins(profile)
    key = read_key()

    dl = os.path.join(WORKDIR, "downloads")
    os.makedirs(dl, exist_ok=True)
    need = profile["size"] + 4 * 1024 ** 3  # tarballs + extracted runtime [test this first]
    free = shutil.disk_usage(WORKDIR).free
    if free < need:
        stop("not enough disk in %s: %.1f GB free, about %.1f GB needed." % (WORKDIR, free / 1e9, need / 1e9))

    llama_tar = download(PINS["llama_url"], os.path.join(dl, "llama.tar.gz"), PINS["llama_sha256"])
    cudart_tar = download(PINS["cudart_url"], os.path.join(dl, "cudart.tar.gz"), PINS["cudart_sha256"])
    cfd = download(PINS["cloudflared_url"], os.path.join(dl, "cloudflared"), PINS["cloudflared_sha256"])
    model = download(profile["url"], os.path.join(dl, "model-%s.gguf" % name), profile["sha256"], profile["size"])

    llama_dir = os.path.join(WORKDIR, "llama")
    cudart_dir = os.path.join(WORKDIR, "cudart")
    shutil.rmtree(llama_dir, ignore_errors=True)
    shutil.rmtree(cudart_dir, ignore_errors=True)
    extract(llama_tar, llama_dir)
    extract(cudart_tar, cudart_dir)
    server_bin = find_file(llama_dir, "llama-server")  # [test this first] folder layout inside the tarball
    if not server_bin:
        stop("llama-server was not found inside the llama.cpp tarball.")
    os.chmod(server_bin, 0o700)
    os.chmod(cfd, 0o700)

    # Key file: one key per line, readable only by this user, never printed, removed on exit.
    key_file = os.path.join(WORKDIR, "api-keys.txt")
    fd = os.open(key_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(key + "\n")
    _cleanup_paths.append(key_file)

    # ------------------------------------------------------------ step 4: llama-server
    # Never add --tools, --agent, --mcp-servers-*, --ui-mcp-proxy, --props or --metrics.
    llama_log = os.path.join(WORKDIR, "llama-server.log")
    cmd = [
        server_bin,
        "-m", model,                       # exact file, sha256-checked above (no -hf)
        "--alias", MODEL_ALIAS,
        "--host", "127.0.0.1",             # local only; the tunnel is the one way in
        "--port", str(PORT),
        "--api-key-file", key_file,
        "--no-webui",
        "--no-slots",
        "--no-mmproj",
        "--offline",                       # no network from llama-server [test this first] with -m
        "--jinja",                         # chat template + tool-call parsing
        "-ngl", "all",
        "-sm", "layer", "-ts", "1,1",      # split layers over both T4s
        "-c", str(profile["ctx"]),
        "-np", "1",                        # one slot holds the whole window
        "-n", str(MAX_OUTPUT_TOKENS),
        "--no-context-shift",              # overflow gives an error, not a silent cut
    ] + profile["flags"]
    lib_path = ":".join(lib_dirs(llama_dir, cudart_dir))
    say("starting llama-server (loading the model takes several minutes)")
    llama = subprocess.Popen(cmd, stdout=open(llama_log, "w"), stderr=subprocess.STDOUT,
                             env=clean_env({"LD_LIBRARY_PATH": lib_path}), start_new_session=True)
    _procs.append(llama)
    signal.signal(signal.SIGTERM, lambda *a: (shutdown(), sys.exit(0)))

    deadline = time.time() + 30 * 60
    while http("/health")[0] != 200:
        if llama.poll() is not None:
            stop("llama-server exited. Last log lines:\n" + tail_scrubbed(llama_log, key)
                 + "\nOut of GPU memory? Try PROFILE = \"A-small\" or \"B\".")
        if time.time() > deadline:
            stop("llama-server did not become healthy in 30 minutes.\n" + tail_scrubbed(llama_log, key))
        time.sleep(5)
    say("llama-server is healthy")
    used = subprocess.run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
                          capture_output=True, text=True).stdout.split()
    say("GPU memory used (MiB): %s  (both should be well above zero)" % used)

    # --------------------------------------------------- step 5: the key must be enforced
    checks = {
        "GET /v1/models": http("/v1/models")[0],
        "POST /v1/chat/completions": http("/v1/chat/completions", method="POST",
                                          payload={"messages": [{"role": "user", "content": "hi"}]})[0],
    }
    bad = {k: v for k, v in checks.items() if v != 401}
    for path in ("/", "/index.html", "/props", "/slots", "/metrics"):
        st = http(path)[0]
        if st == 200:
            bad["GET " + path] = st
    status, body = http("/v1/models", key=key)
    if status != 200 or MODEL_ALIAS.encode() not in body:
        bad["GET /v1/models with key"] = status
    if bad:
        stop("key check failed: %s. The tunnel was NOT opened." % bad)
    say("key check passed: requests without the key are refused (401)")

    # ------------------------------- information only: does tool calling parse?
    tool = {"type": "function", "function": {
        "name": "read_file", "description": "Read a text file from the project",
        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}}}
    status, body = http("/v1/chat/completions", key=key, method="POST", timeout=180, payload={
        "model": MODEL_ALIAS, "stream": False, "max_tokens": 200, "tools": [tool],
        "messages": [{"role": "user", "content": "Use the read_file tool to read src/main.tsx."}]})
    parsed = False
    if status == 200:
        try:
            parsed = bool(json.loads(body)["choices"][0]["message"].get("tool_calls"))
        except (ValueError, KeyError, IndexError):
            parsed = False
    fmt = [l.strip() for l in tail_scrubbed(llama_log, key, n=400).splitlines() if "Chat format" in l]
    say("tool-call check (information only): status %s, parsed tool_calls: %s" % (status, parsed))
    say("server log: %s" % (fmt[-1] if fmt else "no 'Chat format' line found"))

    if MODE == "notebook":
        say("notebook mode: no tunnel was opened. In a NEW cell type, for example:")
        say('    ask("How do I make the player flash red when hit?")')
        say("Stop the Kaggle session when you are done.")
        return

    # ----------------------------------------------------------- step 6: quick tunnel
    cfd_log = os.path.join(WORKDIR, "cloudflared.log")
    tunnel = subprocess.Popen([cfd, "tunnel", "--no-autoupdate", "--url", BASE],
                              stdout=open(cfd_log, "w"), stderr=subprocess.STDOUT,
                              env=clean_env({}), start_new_session=True)
    _procs.append(tunnel)
    url = None
    deadline = time.time() + 120
    pattern = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")  # [test this first] log line format
    while url is None and time.time() < deadline and tunnel.poll() is None:
        try:
            with open(cfd_log, "r", errors="replace") as f:
                m = pattern.search(f.read())
                url = m.group(0) if m else None
        except OSError:
            pass
        time.sleep(2)
    if not url:
        stop("the tunnel did not give an address within 2 minutes.")

    print("", flush=True)
    print("=" * 64, flush=True)
    print("Address (give it to start-helper):  " + url, flush=True)
    print("Model name:                         " + MODEL_ALIAS + "   (profile " + name + ")", flush=True)
    print("Keep this notebook private: this log holds the address.", flush=True)
    print("=" * 64, flush=True)
    print("", flush=True)

    # ------------------------------------------------ step 7: watch, auto-stop, clean up
    started = last_change = time.time()
    last_size = os.path.getsize(llama_log)
    try:
        while True:
            time.sleep(60)
            if llama.poll() is not None or tunnel.poll() is not None:
                stop("llama-server or the tunnel stopped. Start the cell again for a new address.")
            size = os.path.getsize(llama_log)
            if size != last_size:
                last_size, last_change = size, time.time()
            if time.time() - started > MAX_HOURS * 3600:
                shutdown()
                say("reached %.1f hours; stopped. Stop the Kaggle session too." % MAX_HOURS)
                return
            if time.time() - last_change > IDLE_MINUTES * 60:
                shutdown()
                say("no requests for %d minutes; stopped. Stop the Kaggle session too." % IDLE_MINUTES)
                return
    except KeyboardInterrupt:
        shutdown()
        say("stopped by you. Stop the Kaggle session too, to save GPU hours.")


if __name__ == "__main__":
    main()

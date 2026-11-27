#!/usr/bin/env python3
"""kaggle-coder: a private coding model for the Cline VS Code panel, on Kaggle's two T4 GPUs.

It does only that. start.ps1 (on your laptop) sends this file to YOUR PRIVATE notebook with your
key added. Rules it keeps:
  - every download is pinned and checked by sha256 (see PINS below);
  - the model server listens inside Kaggle only, and refuses requests without the key;
  - the key is never printed; child processes get a minimal environment;
  - it gives the GPUs back by itself: a hard time limit, a stop after idle minutes, and an
    immediate exit if a queued run starts too late.

KEEP THIS NOTEBOOK PRIVATE: it holds your key, and its output shows the address.
Nothing here runs model output.
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
import threading
from concurrent.futures import ThreadPoolExecutor
import time
import traceback
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------------------
# Settings (not secret)
# ---------------------------------------------------------------------------------------
PROFILE = os.environ.get("KC_PROFILE", "A")      # "A", or "A-small" if A runs out of GPU memory
MIN_KEY_LEN = 32
MODEL_ALIAS = "kaggle-coder"
PORT = 8080                 # always passed; the README default at this build is 9931


# This file is the only place these are set. Cline's two settings must show the same numbers.
# Memory at 65536: about 18 GB model + 3.2 GiB KV cache + buffers, about 24 of 29 GiB
# (an estimate, not measured on this hardware). If it does not fit: PROFILE A-small, or 49152.
CONTEXT_TOKENS = 65536      # Cline: Context Window Size
MAX_OUTPUT_TOKENS = 8192    # Cline: Max Output Tokens

# Giving the GPUs back. start.ps1 also gives Kaggle its own run time limit (-t) as a backstop.
MAX_HOURS = 2.0             # counted from the moment this script starts, downloads included
# Stop after this long with no model request [test this first]. start.ps1 -Web asks for longer.
_idle = os.environ.get("KC_IDLE_MINUTES", "").strip()
IDLE_MINUTES = int(_idle) if _idle.isdigit() and 5 <= int(_idle) <= 60 else 10
PREP = os.environ.get("KC_PREP", "")                            # "model" or "bin": save files once, then quit
DRYRUN = os.environ.get("KC_DRYRUN") == "1"                     # CPU test: can this notebook see and read the stored model?
CHECK_CACHE = os.environ.get("KC_CHECK_CACHE") == "1"           # after READY: is the prompt cache working?
NOT_AFTER = os.environ.get("KC_NOT_AFTER", "").strip()         # a run starting later than this quits
STARTED = time.time()

DRIVER_DIR = "/usr/local/nvidia/lib64"   # where Kaggle puts the GPU driver libraries
MIN_LOADED_MIB = 4000       # after loading, each GPU must hold at least this much of the model
_watchdog = []

MIN_MIB = 15000             # each GPU must report at least this much (a T4 reports a bit under 16 GiB)
WORKDIR = os.environ.get("KC_WORKDIR", "/tmp/kaggle-coder")  # outside /kaggle/working, so it is not saved as output
BASE = "http://127.0.0.1:%d" % PORT

# ---------------------------------------------------------------------------------------
# PINS. Any value containing "UNPINNED" stops the script.
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
        "flags": QWEN3_SAMPLING,
    },
    # A-small: same model and commit, UD-Q3_K_XL, if A runs out of GPU memory.
    "A-small": {
        "url": "https://huggingface.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF/resolve/"
               "b17cb02dd882d5b6ab62fc777ad2995f19668350/Qwen3-Coder-30B-A3B-Instruct-UD-Q3_K_XL.gguf",
        "sha256": "69cd7578d77dffc0b17e34bad9ef998d08ae0e20ccceef21bad4e7eb3d8c553b",
        "size": 13806312608,
        "flags": QWEN3_SAMPLING,
    },
}

_cleanup_paths = []
_procs = []


def say(msg):
    print("[kaggle-coder] T+%03ds %s" % (time.time() - STARTED, msg), flush=True)


def stop(msg):
    # Keep msg on one line, without double quotes or backslashes: start.ps1 cuts the line there.
    shutdown()
    say("STOPPED: " + msg)
    sys.exit(1)


def shutdown(*_):
    while _watchdog:  # in a web notebook the timer would otherwise outlive the run
        _watchdog.pop().cancel()
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
def check_system():
    """The pinned llama.cpp build was made on Ubuntu 24.04: fail now, not after a big download."""
    try:
        libc = os.confstr("CS_GNU_LIBC_VERSION")  # for example "glibc 2.39"
        version = tuple(int(x) for x in libc.split()[1].split(".")[:2])
    except (AttributeError, ValueError, OSError, IndexError, TypeError):
        return  # cannot tell
    if version < (2, 39):
        stop("this notebook's system is too old (%s). In the notebook settings choose the latest "
             "environment, then run again." % libc)


def clear_leftovers():
    """A restarted web notebook can leave our old server and tunnel running. End them first."""
    try:
        done = subprocess.run(["pkill", "-f", WORKDIR + "/"], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return
    if getattr(done, "returncode", 1) == 0:
        say("ended a server left over from an earlier run")
        time.sleep(3)


def check_pins(profile):
    values = dict(PINS)
    values.update({"model_url": profile["url"], "model_sha256": profile["sha256"]})
    bad = [k for k, v in values.items() if "UNPINNED" in v or not v.strip()]
    if bad:
        stop("these pins are not filled in: " + ", ".join(bad) + ". See PINS in server.py.")
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
    if len(mib) < 2 or min(mib) < MIN_MIB:
        stop("this needs Accelerator GPU T4 x2 (the Kaggle account must be phone-verified).")
    if PROFILE not in PROFILES:
        stop("KC_PROFILE must be A or A-small.")
    say("using profile %s" % PROFILE)
    return PROFILE, PROFILES[PROFILE]


# ------------------------------------------------------------------------ step 2: key
def read_key():
    # start.ps1 adds your key to the private notebook it sends. It is removed from the
    # environment at once so no child process sees it.
    value = os.environ.pop("KC_SESSION_KEY", "").strip()
    if not value:
        stop("no key. Start this with start.cmd on your laptop.")
    return check_key(value)


def check_key(value):
    if len(value) < MIN_KEY_LEN:
        stop("the key is shorter than %d characters. Delete your .kaggle-coder .env file and run start.cmd again." % MIN_KEY_LEN)
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
    say("downloading %s from %s ..." % (os.path.basename(dest), url.split("/")[2]))
    began, next_report = time.time(), 1 << 30  # a line for every GiB, so it never looks stuck
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
                if size >= next_report:
                    next_report += 1 << 30
                    say("  %.0f GiB%s so far, %.0f MiB/s" % (
                        size / 2 ** 30, " of %.1f" % (want_size / 2 ** 30) if want_size else "",
                        size / 2 ** 20 / max(time.time() - began, 1)))
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


def find_mounted(profile):
    """A copy of the model already attached to this notebook (a Kaggle input) saves the whole
    download. Matched by exact size; the prep run (KC_PREP) already checked its sha256."""
    want = os.path.basename(profile["url"])
    for d, _, files in os.walk("/kaggle/input", followlinks=True):
        for f in files:
            if f.endswith(".gguf"):
                path = os.path.join(d, f)
                try:
                    if f == want and os.path.getsize(path) == profile["size"]:
                        return path
                except OSError:
                    pass
    return None


def find_input_file(name, sha256):
    """A stored copy of a small download (llama.cpp, cloudflared) on this notebook's inputs,
    used only if its sha256 matches the pin."""
    for d, _, files in os.walk("/kaggle/input", followlinks=True):
        if name in files:
            path = os.path.join(d, name)
            try:
                if sha256_of(path) == sha256:
                    return path
            except OSError:
                pass
    return None


def fetch(url, dest, sha256, size=None):
    """Stored copy if there is one and it checks out, otherwise download."""
    stored = find_input_file(os.path.basename(dest), sha256)
    if stored:
        say("using stored %s (sha256 ok)" % os.path.basename(dest))
        return stored
    return download(url, dest, sha256, size)


def dump_inputs(max_depth=3):
    base = "/kaggle/input"
    say("what this notebook can see in %s:" % base)
    if not os.path.isdir(base):
        say("  (no such folder)")
        return
    for d, dirs, files in os.walk(base, followlinks=True):
        depth = d[len(base):].count(os.sep)
        if depth >= max_depth:
            dirs[:] = []
        for f in sorted(files)[:20]:
            path = os.path.join(d, f)
            try:
                say("  %s  %.2f GB%s" % (path, os.path.getsize(path) / 1e9, "  (link)" if os.path.islink(path) else ""))
            except OSError:
                say("  %s  (unreadable)" % path)


def dry_run(profile):
    """CPU-only test, no GPU hours: is the stored model visible, and how fast can it be read?"""
    dump_inputs()
    path = find_mounted(profile)
    if not path:
        say("DRYRUN RESULT: model NOT found on inputs. The model storage step has not worked yet.")
        return
    began, read, limit = time.time(), 0, 3 * 1024 ** 3
    with open(path, "rb") as f:
        while read < limit:
            chunk = f.read(8 << 20)
            if not chunk:
                break
            read += len(chunk)
    rate = read / 2 ** 20 / max(time.time() - began, 0.001)
    say("DRYRUN RESULT: model found (%.2f GB). Read speed %.0f MiB/s, so the whole file loads in about %.0f seconds."
        % (os.path.getsize(path) / 1e9, rate, os.path.getsize(path) / 2 ** 20 / max(rate, 1)))
    for name, sha in (("llama.tar.gz", PINS["llama_sha256"]), ("cudart.tar.gz", PINS["cudart_sha256"]),
                      ("cloudflared", PINS["cloudflared_sha256"])):
        say("DRYRUN RESULT: %s %s" % (name, "found (sha256 ok)" if find_input_file(name, sha) else "not stored (it will be downloaded)"))


def cache_check(key):
    """Information only: the same long prompt twice. The second answer should be much faster."""
    prompt = " ".join("Line %d of a long project file about a dungeon game." % i for i in range(700))
    times = []
    for _ in range(2):
        began = time.time()
        status, _ = http("/v1/chat/completions", key=key, method="POST", timeout=600, payload={
            "model": MODEL_ALIAS, "stream": False, "max_tokens": 4,
            "messages": [{"role": "user", "content": prompt + "\nSay ok."}]})
        times.append((status, time.time() - began))
    say("cache check (information only): first %s in %.1fs, second %s in %.1fs. "
        "The second should be several times faster." % (times[0][0], times[0][1], times[1][0], times[1][1]))


def public_ready(url, key, seconds=90):
    """True once the PUBLIC address answers our key with 200 (the tunnel really carries traffic)."""
    end = time.time() + seconds
    while time.time() < end:
        try:
            req = urllib.request.Request(url + "/v1/models",
                                         headers={"Authorization": "Bearer " + key, "User-Agent": "kaggle-coder"})
            with urllib.request.urlopen(req, timeout=8) as r:
                if r.status == 200:
                    return True
        except (urllib.error.URLError, OSError, ValueError):
            pass
        time.sleep(1)
    return False


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


# ------------------------------------------------------------- giving the GPUs back
def hard_stop():
    say("STOPPED: reached the %.1f hour limit, so the GPUs are given back." % MAX_HOURS)
    shutdown()
    os._exit(0)  # ends the batch run even if the main thread is busy


# llama.cpp b12318 logs these at its default verbosity, only while it works on a model request:
#   "slot <function>: id  0 | task 12 | ..."  when a request starts and ends, after each prompt
#   batch once the prompt has taken 3 s, and every 3 s of a reply once it passes 100 tokens.
# "task -1" (no request attached) and "srv" lines (such as a refused key) do not match.
MODEL_WORK = re.compile(rb"slot +[!-~]+: +id +[0-9]+ [|] task +[0-9]+ [|]"
                       rb"|request: POST /v1/\S+ \S+ 200")  # either kind of line counts as use


def model_used(path, offset):
    """(was a model request worked on since offset?, new offset). Other traffic, such as a
    stranger probing the address, does not count."""
    try:
        with open(path, "rb") as f:
            f.seek(offset)
            new = f.read()
    except OSError:
        return False, offset
    end = new.rfind(b"\n") + 1  # keep a half-written line for next time
    return MODEL_WORK.search(new[:end]) is not None, offset + end


# ---------------------------------------------------------------------------- main
def main():
    if NOT_AFTER.isdigit():
        say("run id " + NOT_AFTER)  # start.ps1 uses this to ignore an older run's output
    if NOT_AFTER and not NOT_AFTER.isdigit():
        stop("KC_NOT_AFTER is not a whole number. Run start.cmd again.")
    if NOT_AFTER and time.time() > int(NOT_AFTER):
        say("STOPPED: this run waited in Kaggle's queue too long, so it quit to save GPU time. "
            "Run start.cmd again.")
        return
    watchdog = threading.Timer(MAX_HOURS * 3600, hard_stop)
    watchdog.daemon = True
    watchdog.start()
    if hasattr(watchdog, "cancel"):
        _watchdog.append(watchdog)
    check_system()
    clear_leftovers()
    if PREP or DRYRUN:
        name, profile, key = PROFILE, PROFILES[PROFILE], ""
        check_pins(profile)
        if DRYRUN:
            dry_run(profile)
            return
    else:
        name, profile = choose_profile()
        check_pins(profile)
        key = read_key()

    dl = os.path.join(WORKDIR, "downloads")
    os.makedirs(dl, exist_ok=True)
    need = (profile["size"] if PREP != "bin" else 0) + 4 * 1024 ** 3  # model + tarballs + extracted runtime
    if PREP:
        os.makedirs("/kaggle/working", exist_ok=True)
        if shutil.disk_usage("/kaggle/working").free < need - 3 * 1024 ** 3:
            stop("not enough room in /kaggle/working to save the files.")
    need -= sum(os.path.getsize(os.path.join(dl, f)) for f in os.listdir(dl))  # kept from an earlier run
    free = shutil.disk_usage(WORKDIR).free
    if free < need:
        stop("not enough disk in %s: %.1f GB free, about %.1f GB needed." % (WORKDIR, free / 1e9, need / 1e9))

    if PREP == "bin":
        out = "/kaggle/working"
        for url, name_, sha in ((PINS["llama_url"], "llama.tar.gz", PINS["llama_sha256"]),
                                (PINS["cudart_url"], "cudart.tar.gz", PINS["cudart_sha256"]),
                                (PINS["cloudflared_url"], "cloudflared", PINS["cloudflared_sha256"])):
            download(url, os.path.join(out, name_), sha)
        say("PREP DONE: llama.cpp and cloudflared are saved as this notebook's output.")
        return
    if PREP:
        # Prep run (CPU is enough, no GPU hours): keep the checked model as this notebook's output,
        # so later runs attach it and skip the download.
        out = "/kaggle/working"
        dest = download(profile["url"], os.path.join(out, os.path.basename(profile["url"])),
                        profile["sha256"], profile["size"])
        with open(os.path.join(out, "model.ok"), "w") as f:
            f.write("%s %d\n" % (profile["sha256"], os.path.getsize(dest)))
        say("PREP DONE: the model (%d bytes, sha256 checked) is saved as this notebook's output." % os.path.getsize(dest))
        return
    mounted = find_mounted(profile)
    if mounted:
        say("model found on this notebook's inputs (no download): " + mounted)
    # Everything is fetched at the same time; the model is the long one.
    with ThreadPoolExecutor(4) as pool:
        f_llama = pool.submit(fetch, PINS["llama_url"], os.path.join(dl, "llama.tar.gz"), PINS["llama_sha256"])
        f_cuda = pool.submit(fetch, PINS["cudart_url"], os.path.join(dl, "cudart.tar.gz"), PINS["cudart_sha256"])
        f_cfd = pool.submit(fetch, PINS["cloudflared_url"], os.path.join(dl, "cloudflared"), PINS["cloudflared_sha256"])
        f_model = None if mounted else pool.submit(
            download, profile["url"], os.path.join(dl, "model-%s.gguf" % name), profile["sha256"], profile["size"])
        llama_tar, cudart_tar, cfd = f_llama.result(), f_cuda.result(), f_cfd.result()
        model = mounted or f_model.result()

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
        "--jinja",                         # chat template + tool-call parsing
        "-fa", "on",                       # flash attention
        "-ctk", "q8_0", "-ctv", "q8_0",    # 8-bit KV cache: about half the memory of f16
        "-ngl", "all",
        "-sm", "layer", "-ts", "1,1",      # split layers over both T4s
        "-c", str(CONTEXT_TOKENS),
        "-np", "1",                        # one slot holds the whole window
        # Agent steps resend a long prompt. An unchanged start is reused by default; this also
        # reuses later chunks that moved after the agent trimmed its history. [test this first]
        "--cache-reuse", "256",
        "-n", str(MAX_OUTPUT_TOKENS),      # fallback only; a client's max_tokens overrides it
        "--no-context-shift",              # overflow gives an error, not a silent cut
    ] + profile["flags"]
    # Our libraries first, then Kaggle's GPU driver folder: without it llama.cpp can fall back to the CPU.
    lib_path = ":".join(lib_dirs(llama_dir, cudart_dir) + [DRIVER_DIR])
    say("starting llama-server (loading the model takes several minutes)")
    with open(llama_log, "w") as llama_out:
        llama = subprocess.Popen(cmd, stdout=llama_out, stderr=subprocess.STDOUT,
                                env=clean_env({"LD_LIBRARY_PATH": lib_path,
                                               "CUDA_CACHE_MAXSIZE": "4294967296"}),  # first start compiles for T4
                                start_new_session=True)
    _procs.append(llama)
    signal.signal(signal.SIGTERM, lambda *a: stop("the run was asked to end."))

    deadline = time.time() + 30 * 60
    while http("/health")[0] != 200:
        exited = llama.poll() is not None
        if exited or time.time() > deadline:
            print(tail_scrubbed(llama_log, key), flush=True)
            stop(("llama-server exited while starting." if exited
                  else "llama-server was not ready after 30 minutes.")
                 + " Its last log lines are in the notebook output above. If they say out of memory:"
                 " in server.py, change the KC_PROFILE default from A to A-small, or set CONTEXT_TOKENS"
                 " to 49152 (and Context Window Size in Cline to 49152 too). Then run start.cmd again.")
        time.sleep(1)
    say("llama-server is healthy")
    used = subprocess.run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
                          capture_output=True, text=True, timeout=30).stdout.split()
    say("GPU memory used (MiB): %s" % used)
    mib = [int(x) for x in used if x.isdigit()]
    if len(mib) < 2 or min(mib) < MIN_LOADED_MIB:
        stop("the model did not load onto both GPUs (it would run very slowly on the CPU). "
             "Last server log lines:\n" + tail_scrubbed(llama_log, key))

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

    # ----------------------------------------------------------------- step 6: tunnel
    cfd_log = os.path.join(WORKDIR, "cloudflared.log")
    with open(cfd_log, "w") as cfd_out:
        tunnel = subprocess.Popen([cfd, "tunnel", "--no-autoupdate", "--url", BASE],
                                  stdout=cfd_out, stderr=subprocess.STDOUT,
                                  env=clean_env({}), start_new_session=True)
    _procs.append(tunnel)
    url = None
    deadline = time.time() + 120
    # api.trycloudflare.com can appear in cloudflared error lines; it is never our address.
    pattern = re.compile(r"https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com")  # [test this first]
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
    say("tunnel address received, checking that it carries traffic...")
    if not public_ready(url, key):
        stop("the tunnel address did not answer in time. Run start.cmd again.")

    print("", flush=True)
    print("=" * 64, flush=True)
    print("Address: " + url, flush=True)
    say("READY after %d seconds. Cline: Model ID %s, Context Window Size %d, Max Output Tokens %d (profile %s)"
        % (time.time() - STARTED, MODEL_ALIAS, CONTEXT_TOKENS, MAX_OUTPUT_TOKENS, name))
    print("Keep this notebook private: this log holds the address.", flush=True)
    print("=" * 64, flush=True)
    print("", flush=True)

    # ------------- information only, after READY so it never delays you: does tool calling parse?
    tool = {"type": "function", "function": {
        "name": "read_file", "description": "Read a text file from the project",
        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}}}
    status, body = http("/v1/chat/completions", key=key, method="POST", timeout=600, payload={
        "model": MODEL_ALIAS, "stream": False, "max_tokens": 200, "tools": [tool],
        "messages": [{"role": "user", "content": "Use the read_file tool to read index.js."}]})
    parsed = False
    if status == 200:
        try:
            parsed = bool(json.loads(body)["choices"][0]["message"].get("tool_calls"))
        except (ValueError, KeyError, IndexError):
            parsed = False
    fmt = [l.strip() for l in tail_scrubbed(llama_log, key, n=400).splitlines() if "Chat format" in l]
    say("tool-call check (information only): status %s, parsed tool_calls: %s" % (status, parsed))
    say("server log: %s" % (fmt[-1] if fmt else "no 'Chat format' line found"))

    if CHECK_CACHE:
        cache_check(key)

    # ------------------------------------------------ step 7: watch, auto-stop, clean up
    say("GPUs are given back after %d idle minutes, or %.1f hours at most." % (IDLE_MINUTES, MAX_HOURS))
    offset = os.path.getsize(llama_log)  # startup and self-test lines do not count as use
    last_use = time.time()               # the idle clock starts now, at READY
    warned = False
    while True:
        time.sleep(15)
        if llama.poll() is not None or tunnel.poll() is not None:
            stop("llama-server or the tunnel stopped. Run start.cmd again.")
        used_now, offset = model_used(llama_log, offset)
        if used_now:
            last_use = time.time()
            warned = False
        idle = time.time() - last_use
        if idle > (IDLE_MINUTES - 2) * 60 and not warned:
            warned = True
            say("no requests for %d minutes: stopping in 2 minutes unless you ask Cline something." % (IDLE_MINUTES - 2))
        if idle > IDLE_MINUTES * 60:
            shutdown()
            say("STOPPED: no model requests for %d minutes, so the GPUs are given back." % IDLE_MINUTES)
            return  # the script ends, which ends the batch run


def run():
    """main(), but an unplanned end also stops the child processes and prints a STOPPED line."""
    try:
        main()
    except KeyboardInterrupt:
        stop("stopped by you.")
    except Exception as e:
        traceback.print_tb(e.__traceback__)  # where, without the message: it could hold the key
        stop("unexpected %s. Run start.cmd again; if it repeats, tell Corey." % type(e).__name__)


if __name__ == "__main__":
    run()

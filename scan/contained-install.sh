#!/usr/bin/env bash
# scan/contained-install.sh - install the project's dependencies INSIDE a throw-away container, never on the host,
# then statically scan the resulting node_modules with the same rules as security-scan.sh.
#
# Usage: scan/contained-install.sh [--project DIR] [--out DIR] [--run-esbuild-postinstall] [--keep] [--image IMG] [--dry-run]
#   --project DIR               project directory containing package.json + package-lock.json
#                               (default: the single directory with a lockfile under the repo)
#   --out DIR                   where the container writes node_modules (default: a new scratch dir)
#   --run-esbuild-postinstall   stage 2: also run esbuild's own postinstall, with the network OFF
#   --keep                      keep the scratch copy and output after the run
#   --image IMG                 node image (default node:22-bookworm-slim)
#   --dry-run                   print what would run, run nothing
#
# ---------------------------------------------------------------------------------------------------------
# WHAT THIS DOES (one page)
#
#  1. Copies the project (without node_modules, dist, .git) into a fresh scratch directory. The copy's .npmrc
#     is REPLACED by a hardened one (registry pinned to npmjs, ignore-scripts=true, no auth). The son's files
#     in the repo are never touched.
#  2. Runs `npm ci --ignore-scripts` in a docker (or podman) container:
#        - image pinned by tag (node:22-bookworm-slim), run as a non-root uid (your uid), --cap-drop ALL,
#          --security-opt no-new-privileges, read-only root filesystem, 2 GB memory, 512 pids,
#        - the project copy is mounted READ-ONLY at /src; the container copies it to /work (a writable mount
#          that is the --out directory on the host) and installs there,
#        - network is ON for this stage (it has to reach registry.npmjs.org). It is a plain bridge network:
#          docker cannot restrict it to one hostname without extra firewall rules, so during this stage a
#          malicious package *could* talk to the internet -- but with --ignore-scripts no package code runs
#          at all; npm only downloads and unpacks tarballs and verifies their sha512 against the lockfile.
#  3. Stage 2 (optional, --run-esbuild-postinstall): with --network none, runs `npm rebuild esbuild` so that
#     only esbuild's known postinstall executes, offline, inside the container. The game works without this
#     step because npm already installed the platform binary @esbuild/linux-x64 as an optional dependency.
#  4. Runs `npm audit signatures` inside the container (registry signatures + provenance of the installed tree).
#  5. On the host, runs the read-only static scanner (scan/lib/nm-scan.js and the lockfile drift check) over
#     the produced node_modules, and prints where the result lives. Reading files cannot execute them.
#
# RESIDUAL RISK after this script
#  - It proves the install itself is contained. It does not make the installed packages trustworthy:
#    a malicious package could still act when the game is BUILT or RUN (vite dev server, vite build).
#    Run those steps in a container too, or at least never as a privileged user and never with `vite --host`
#    on a network you do not control.
#  - esbuild, rollup/rolldown, lightningcss, tailwind oxide ship native binaries; the scanner only lists them.
#  - If you copy the produced node_modules into the live project, you are trusting this scan's rules.
#    Prefer rebuilding inside the container each time with `npm ci` instead of moving node_modules around.
# ---------------------------------------------------------------------------------------------------------
set -u
unset -f grep 2>/dev/null
GREP=/usr/bin/grep
HERE=$(cd "$(dirname "$0")/.." && pwd -P)
LIB="$HERE/scan/lib"
ALLOW="$HERE/scan/allowlist.txt"

PROJECT=""; OUT=""; STAGE2=0; KEEP=0; DRY=0
IMAGE="node:22-bookworm-slim"
while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="$2"; shift;;
    --out) OUT="$2"; shift;;
    --run-esbuild-postinstall) STAGE2=1;;
    --keep) KEEP=1;;
    --image) IMAGE="$2"; shift;;
    --dry-run) DRY=1;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "unknown option $1" >&2; exit 2;;
  esac; shift
done

if [ -z "$PROJECT" ]; then
  LOCKS=$(cd "$HERE" && git ls-files -co --exclude-standard | $GREP -E '(^|/)package-lock\.json$' | $GREP -v node_modules/)
  N=$(echo "$LOCKS" | $GREP -c . || true)
  [ "$N" -eq 1 ] || { echo "found $N lockfiles; pass --project DIR" >&2; echo "$LOCKS" >&2; exit 2; }
  PROJECT="$HERE/$(dirname "$LOCKS")"
fi
PROJECT=$(cd "$PROJECT" && pwd -P) || exit 2
[ -f "$PROJECT/package-lock.json" ] || { echo "no package-lock.json in $PROJECT; refuse to install without a lockfile" >&2; exit 2; }

ENGINE=""
if command -v docker >/dev/null && docker info >/dev/null 2>&1; then ENGINE=docker
elif command -v podman >/dev/null; then ENGINE=podman
fi
if [ -z "$ENGINE" ]; then
  cat >&2 <<'EOF'
No usable docker or podman found. Nothing was run.
Fallbacks, in order of preference:
  - install docker (or podman) and re-run this script;
  - bubblewrap:  bwrap --unshare-all --share-net --ro-bind /usr /usr --ro-bind /lib /lib --ro-bind /lib64 /lib64 \
                   --ro-bind /etc/resolv.conf /etc/resolv.conf --ro-bind /etc/ssl /etc/ssl --tmpfs /tmp --dir /work \
                   --bind <scratch-copy> /work --chdir /work --unsetenv HOME --setenv HOME /tmp --die-with-parent \
                   npm ci --ignore-scripts --registry=https://registry.npmjs.org
    (unprivileged user namespaces must be enabled; on this host `unshare -Ur` was refused, so bwrap would need setuid);
  - a separate throw-away VM or a spare machine with nothing else on it.
Never fall back to `npm install` on the host.
EOF
  exit 3
fi

SCRATCH_BASE="${SCAN_SCRATCH:-${TMPDIR:-/tmp}}"
WORK=$(mktemp -d "$SCRATCH_BASE/contained-install.XXXXXX") || exit 2
SRC="$WORK/src"; [ -n "$OUT" ] || OUT="$WORK/out"
mkdir -p "$SRC" "$OUT"
cleanup() { if [ "$KEEP" -eq 0 ]; then rm -rf "$WORK"; else echo "kept: $WORK (copy) and $OUT (install result)"; fi; }
trap cleanup EXIT

echo "contained-install: engine=$ENGINE image=$IMAGE"
echo "  project : $PROJECT"
echo "  copy    : $SRC   (read-only inside the container)"
echo "  result  : $OUT   (node_modules appears here)"

# 1. copy without node_modules/dist/.git; harden the copy's .npmrc (the repo's own .npmrc is untouched)
tar -C "$PROJECT" --exclude=./node_modules --exclude=./dist --exclude=./.git -cf - . | tar -C "$SRC" --warning=no-timestamp -xf -
cat > "$SRC/.npmrc" <<'EOF'
registry=https://registry.npmjs.org/
ignore-scripts=true
fund=false
audit=false
update-notifier=false
EOF
UID_GID="$(id -u):$(id -g)"
# shellcheck disable=SC2054  # the commas belong to the --tmpfs option value
COMMON=(--rm --user "$UID_GID" --cap-drop ALL --security-opt no-new-privileges --read-only
        --tmpfs /tmp:rw,noexec,nosuid,size=1g --memory 2g --pids-limit 512
        -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache -e npm_config_update_notifier=false -e CI=1
        -v "$SRC:/src:ro" -v "$OUT:/work:rw" -w /work "$IMAGE")

STAGE1='set -e; cp -a /src/. /work/; cd /work; echo "node $(node -v) npm $(npm -v)"; npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org; echo "--- npm audit signatures"; npm audit signatures --registry=https://registry.npmjs.org || echo "(signatures check reported a problem; see above)"'
STAGE2_CMD='set -e; cd /work; npm rebuild esbuild --foreground-scripts --registry=https://registry.npmjs.org; node -e "require(\"esbuild\")" >/dev/null 2>&1 && echo "esbuild loads" || echo "esbuild did not load"'

if [ "$DRY" -eq 1 ]; then
  echo "[dry-run] $ENGINE run --network bridge ${COMMON[*]} sh -c '$STAGE1'"
  [ "$STAGE2" -eq 1 ] && echo "[dry-run] $ENGINE run --network none ${COMMON[*]} sh -c '$STAGE2_CMD'"
  echo "[dry-run] node $LIB/nm-scan.js --dir $OUT/node_modules --allowlist $ALLOW --label sandbox --id-prefix 30"
  exit 0
fi

echo; echo "== stage 1: npm ci --ignore-scripts (network on, no package code runs)"
"$ENGINE" run --network bridge "${COMMON[@]}" sh -c "$STAGE1" || { echo "stage 1 failed"; exit 1; }

if [ "$STAGE2" -eq 1 ]; then
  echo; echo "== stage 2: esbuild postinstall only (network OFF)"
  "$ENGINE" run --network none "${COMMON[@]}" sh -c "$STAGE2_CMD" || echo "stage 2 reported a problem (the game still works without it)"
fi

echo; echo "== static scan of the installed tree (host reads files; nothing is executed)"
export SCAN_RESULTS="$WORK/results.jsonl" SCAN_META="$WORK/meta.jsonl"
node "$LIB/nm-scan.js" --dir "$OUT/node_modules" --allowlist "$ALLOW" --label sandbox --id-prefix 30
echo "-- lockfile vs installed"
node -e '
const fs=require("fs");const lock=JSON.parse(fs.readFileSync(process.argv[1]+"/package-lock.json","utf8")).packages;
const inst=JSON.parse(fs.readFileSync(process.argv[2]+"/node_modules/.package-lock.json","utf8")).packages;
let diff=0,missing=0;for(const [k,e] of Object.entries(lock)){if(!k||e.link)continue;if(!inst[k]){if(!e.optional)missing++;continue}if(inst[k].version!==e.version||(inst[k].integrity&&e.integrity&&inst[k].integrity!==e.integrity))diff++}
let extra=0;for(const k of Object.keys(inst))if(k&&!lock[k]&&!inst[k].inBundle)extra++; // bundled sub-packages are expected to be absent from the lockfile
console.log(`  installed ${Object.keys(inst).length-1} packages: ${missing} missing (non-optional), ${diff} differ, ${extra} extra -> ${(missing||diff||extra)?"MISMATCH":"matches the lockfile"}`);
process.exit((missing||diff||extra)?1:0)' "$PROJECT" "$OUT"
FAILS=$($GREP -c '"status":"FAIL"' "$SCAN_RESULTS" || true)
echo
if [ "${FAILS:-0}" -gt 0 ]; then echo "RESULT: FAIL-level indicator(s) in the installed tree. Do not use this node_modules. Read the lines above."; exit 1; fi
echo "RESULT: no FAIL-level indicators in the contained install. Residual risk is described at the top of this script."
echo "Installed tree: $OUT/node_modules $( [ "$KEEP" -eq 0 ] && echo '(deleted on exit; use --keep or --out to retain)')"

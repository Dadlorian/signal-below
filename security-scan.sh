#!/usr/bin/env bash
# security-scan.sh - read-only supply-chain and code security scan for this repo.
#
# Never edits, installs, builds or runs project code. The only network calls are read-only
# registry lookups (npm audit, npm audit signatures, npm view), and --offline turns them off.
#
# Usage: ./security-scan.sh [options]
#   --offline            no network at all (skips npm audit, signatures and registry metadata)
#   --no-audit           skip npm audit / audit signatures (registry metadata still runs)
#   --quick              skip the slow parts: registry metadata, zip extraction, git patch scan
#   --report-dir DIR     where to write the report (default: ./reports)
#   --cache-dir DIR      cache for registry metadata (default: ~/.cache/beta-games-security-scan)
#   --min-age-days N     flag package versions younger than N days (default 14)
#   --tunnel-host HOST   hostname that must stay in vite allowedHosts (default signal.gamelab.link)
#   --help               this text
#
# Exit code: 1 if any check FAILed, otherwise 0. Risk verdict rules are in scan/README.md.
set -u
unset -f grep 2>/dev/null       # a shell wrapper named grep leaks into scripts on this host
GREP=/usr/bin/grep
export LC_ALL=C
cd "$(dirname "$0")" || exit 2
REPO=$(pwd -P)
LIB="$REPO/scan/lib"; export LIB_DIR="$LIB"
ALLOW="$REPO/scan/allowlist.txt"; export ALLOW_FILE="$ALLOW"

OFFLINE=0; NOAUDIT=0; QUICK=0
REPORT_DIR="$REPO/reports"
CACHE_DIR="${SCAN_CACHE_DIR:-$HOME/.cache/beta-games-security-scan/registry}"
MIN_AGE=14
TUNNEL_HOST="${SCAN_TUNNEL_HOST:-signal.gamelab.link}"
OPTS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --offline) OFFLINE=1; OPTS+=("$1");;
    --no-audit) NOAUDIT=1; OPTS+=("$1");;
    --quick) QUICK=1; OPTS+=("$1");;
    --report-dir) REPORT_DIR="$2"; shift;;
    --cache-dir) CACHE_DIR="$2"; shift;;
    --min-age-days) MIN_AGE="$2"; shift;;
    --tunnel-host) TUNNEL_HOST="$2"; shift;;
    --help|-h) sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "unknown option: $1 (try --help)" >&2; exit 2;;
  esac
  shift
done
for t in node npm git; do command -v "$t" >/dev/null || { echo "missing tool: $t" >&2; exit 2; }; done

# Scratch area for this run (results, evidence, extracted archives). Never inside the project.
SCRATCH_BASE="${SCAN_SCRATCH:-${TMPDIR:-/tmp}}"
RUN_DIR=$(mktemp -d "$SCRATCH_BASE/security-scan.XXXXXX") || exit 2
export SCAN_RESULTS="$RUN_DIR/results.jsonl" SCAN_META="$RUN_DIR/meta.jsonl"
: > "$SCAN_RESULTS"; : > "$SCAN_META"
STAMP=$(date +%Y-%m-%d-%H%M)
REPORT_MD="$REPORT_DIR/security-report-$STAMP.md"
REPORT_JSON="$REPORT_DIR/latest.json"
mkdir -p "$REPORT_DIR" "$CACHE_DIR"
trap 'rm -rf "$RUN_DIR"' EXIT

rec()  { node "$LIB/rec.js" rec "$@"; }      # rec STATUS ID CLASS TITLE SUMMARY [EVIDENCE_FILE]
meta() { node "$LIB/rec.js" meta "$@"; }     # meta KEY JSON
hdr()  { echo; echo "== $*"; }
# npm is always run with the registry forced and scripts disabled, so a project .npmrc cannot redirect it.
NPMFLAGS=(--registry=https://registry.npmjs.org --ignore-scripts --no-fund --no-update-notifier --loglevel=error)

echo "security-scan: $REPO  ($(date -Is))"
echo "options: ${OPTS[*]:-none}   report: $REPORT_MD"

# Tracked + untracked, not ignored (so node_modules and dist are skipped). Also the ignored list, for [1].
# The scanner's own report directory is excluded: reports quote the very indicators the scanner looks for.
REPORT_REL=$(realpath -m --relative-to="$REPO" "$REPORT_DIR" 2>/dev/null || echo "reports")
case "$REPORT_REL" in ../*|/*) REPORT_REL="reports";; esac
git ls-files -co --exclude-standard | $GREP -vE "^(reports|${REPORT_REL})/" > "$RUN_DIR/files.txt"
git ls-files -oi --exclude-standard --directory 2>/dev/null | $GREP -v '/$' > "$RUN_DIR/ignored.txt" || true
git ls-files -oi --exclude-standard 2>/dev/null | $GREP -vE '(^|/)node_modules/|(^|/)dist/' >> "$RUN_DIR/ignored.txt" || true
sort -u -o "$RUN_DIR/ignored.txt" "$RUN_DIR/ignored.txt"
$GREP -E '(^|/)package-lock\.json$' "$RUN_DIR/files.txt" | $GREP -v node_modules/ > "$RUN_DIR/locks.txt" || true
meta gitStatus "$(git status --porcelain | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>console.log(JSON.stringify(s.split("\n").filter(Boolean))))')"
meta options "$(printf '%s\n' "${OPTS[@]:-}" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>console.log(JSON.stringify(s.split("\n").filter(Boolean))))')"

hdr "A. Files and secrets  [1 sensitive files] [2 secrets + personal data] [21 binaries]"
node "$LIB/files-scan.js" --repo "$REPO" --allowlist "$ALLOW" --ignored-list "$RUN_DIR/ignored.txt" < "$RUN_DIR/files.txt"

hdr "B. Dependency manifests  [4 install scripts] [5 pinning] [6 lock sync]"
node "$LIB/manifests.js" --repo "$REPO" --allowlist "$ALLOW" < "$RUN_DIR/files.txt"

hdr "C. Lockfile  [3 sources+integrity] [10 lookalike names] [12 diff vs HEAD] [13 node_modules drift]"
if [ ! -s "$RUN_DIR/locks.txt" ]; then
  rec WARN 3 critical "Lockfile sources and integrity" "no package-lock.json in the repo; nothing pins what npm would install"
fi
while IFS= read -r L; do
  echo "-- $L"
  node "$LIB/lockfile.js" --lock "$REPO/$L" --repo "$REPO" --allowlist "$ALLOW"
done < "$RUN_DIR/locks.txt"

hdr "D. Registry metadata  [11 release age / maintainers / deprecation / provenance]"
if [ "$QUICK" -eq 1 ]; then
  rec SKIP 11 critical "Registry metadata (release age, maintainers, deprecation)" "--quick"
else
  while IFS= read -r L; do
    echo "-- $L"
    OFF=(); [ "$OFFLINE" -eq 1 ] && OFF=(--offline)
    BASE=(); git show "HEAD:$L" > "$RUN_DIR/base-lock.json" 2>/dev/null && BASE=(--baseline "$RUN_DIR/base-lock.json")
    node "$LIB/registry-meta.js" --lock "$REPO/$L" --cache-dir "$CACHE_DIR" --min-age-days "$MIN_AGE" "${BASE[@]}" "${OFF[@]}"
  done < "$RUN_DIR/locks.txt"
fi

hdr "E. npm audit  [9 advisories] [15 registry signatures]"
if [ "$OFFLINE" -eq 1 ] || [ "$NOAUDIT" -eq 1 ]; then
  rec SKIP 9 critical "npm audit (known vulnerabilities)" "$( [ "$OFFLINE" -eq 1 ] && echo --offline || echo --no-audit )"
  rec SKIP 15 critical "npm audit signatures" "$( [ "$OFFLINE" -eq 1 ] && echo --offline || echo --no-audit )"
else
  while IFS= read -r L; do
    D="$REPO/$(dirname "$L")"
    echo "-- $L"
    ( cd "$D" && npm audit --json "${NPMFLAGS[@]}" 2>"$RUN_DIR/audit.err" ) > "$RUN_DIR/audit.json"
    node - "$RUN_DIR/audit.json" "$(dirname "$L")" <<'EOF'
const fs=require('fs');const C=require(process.env.LIB_DIR+'/common.js');
const [file,dir]=process.argv.slice(2);let j=null;try{j=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
if(!j||!j.metadata){C.emit({id:'9',cls:'critical',title:'npm audit (known vulnerabilities)',status:'WARN',summary:dir+': audit could not run (network or registry problem); see terminal',evidence:[]});process.exit(0)}
const v=j.metadata.vulnerabilities||{};const ev=[];
const allow=C.loadAllowlist(process.env.ALLOW_FILE||'');let accepted=0,open={critical:0,high:0,moderate:0,low:0};
for(const [name,x] of Object.entries(j.vulnerabilities||{})){const via=(x.via||[]).filter(o=>typeof o==='object');
 const titles=via.map(o=>`${o.title}${o.url?' ('+o.url+')':''}${o.range?' affects '+o.range:''}`);
 const through=(x.via||[]).filter(o=>typeof o==='string');
 const ids=[name,...via.map(o=>(o.url||'').split('/').pop()).filter(Boolean)];
 // moderate/low advisories can be accepted by package name or GHSA id (kind "advisory"); high/critical never.
 const a=(['moderate','low'].includes(x.severity))?ids.map(i=>C.allowed(allow,'advisory',i)).find(Boolean):null;
 if(a)accepted++;else open[x.severity]=(open[x.severity]||0)+1;
 ev.push(`${a?'accepted':(x.severity||'?').toUpperCase().padEnd(8)} ${name}@${x.range||'?'}${x.isDirect?' (direct dependency)':''}: ${titles.length?titles.join('; '):'via '+through.join(', ')}${x.fixAvailable?'  fix: '+(typeof x.fixAvailable==='object'?x.fixAvailable.name+'@'+x.fixAvailable.version+(x.fixAvailable.isSemVerMajor?' (MAJOR; do not auto-fix)':''):'available'):'  no fix yet'}${a?'  (allowlisted: '+a.reason+')':''}`)}
ev.sort((a,b)=>{const o={CRITICAL:0,HIGH:1,MODERATE:2,LOW:3,INFO:4,accepted:5};return (o[a.split(' ')[0]]??9)-(o[b.split(' ')[0]]??9)});
const status=(v.critical||v.high)?'FAIL':(open.moderate||open.low)?'WARN':'PASS';
C.meta('audit.'+dir,v);
C.emit({id:'9',cls:'critical',title:'npm audit (known vulnerabilities)',status,summary:`${dir}: critical=${v.critical||0} high=${v.high||0} moderate=${v.moderate||0} low=${v.low||0} (of ${j.metadata.dependencies?.total??'?'} packages)${accepted?'; '+accepted+' accepted via allowlist':''}`,evidence:ev});
EOF
    # Registry signatures / provenance attestations for the installed tree (needs node_modules; falls back to the lockfile tree).
    ( cd "$D" && npm audit signatures --json "${NPMFLAGS[@]}" 2>"$RUN_DIR/sig.err" ) > "$RUN_DIR/sig.json"; SIG_RC=$?
    node - "$RUN_DIR/sig.json" "$RUN_DIR/sig.err" "$SIG_RC" "$(dirname "$L")" <<'EOF'
const fs=require('fs');const C=require(process.env.LIB_DIR+'/common.js');
const [file,errf,rc,dir]=process.argv.slice(2);let j=null;try{j=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
const err=fs.existsSync(errf)?fs.readFileSync(errf,'utf8').trim():'';
if(!j){const nm=!fs.existsSync(dir+'/node_modules');C.emit({id:'15',cls:'critical',title:'npm audit signatures (registry signatures + provenance)',status:nm?'INFO':'WARN',summary:nm?dir+': skipped, needs an installed node_modules (run after scan/contained-install.sh)':dir+': could not verify: '+C.trunc(err.split('\n').pop()||('exit '+rc),140),evidence:err?err.split('\n').slice(-5):[]});process.exit(0)}
const inv=(j.invalid||[]).map(p=>`INVALID signature: ${p.name}@${p.version}`);const mis=(j.missing||[]).map(p=>`missing signature: ${p.name}@${p.version}`);
const status=inv.length?'FAIL':(mis.length?'WARN':'PASS');
const n=j.verifiedCount??j.verified;
C.emit({id:'15',cls:'critical',title:'npm audit signatures (registry signatures + provenance)',status,summary:`${dir}: ${inv.length} invalid, ${mis.length} missing registry signatures${n!==undefined?`, ${n} verified`:' (npm --json omits the verified count; the contained install prints it in full)'}`,evidence:[...inv,...mis.slice(0,50)]});
EOF
  done < "$RUN_DIR/locks.txt"
fi

# [27] npm 11.x+ "npm install-scripts ls": read-only list of dependencies with install scripts (feature-detected; never approve/deny).
if npm install-scripts --help >/dev/null 2>&1 && ! npm install-scripts --help 2>&1 | $GREP -qi 'unknown command'; then
  while IFS= read -r L; do
    D="$REPO/$(dirname "$L")"
    ( cd "$D" && npm install-scripts ls "${NPMFLAGS[@]}" 2>&1 ) | head -60 > "$RUN_DIR/isl.txt"
    rec INFO 27 critical "npm install-scripts ls (npm $(npm --version))" "$(dirname "$L"): $(wc -l < "$RUN_DIR/isl.txt") line(s) listed below; the scan's own allowlist in [4] is the policy" "$RUN_DIR/isl.txt"
  done < "$RUN_DIR/locks.txt"
else
  rec INFO 27 critical "npm install-scripts ls" "not available in npm $(npm --version) (added in a newer npm); install scripts are still blocked by --ignore-scripts in scan/contained-install.sh"
fi

hdr "F. Installed node_modules static scan  [14a lifecycle] [14b bins] [14c IOCs] [14d capabilities] [14e allowlisted] [14f natives]"
FOUND_NM=0
while IFS= read -r L; do
  NM="$REPO/$(dirname "$L")/node_modules"
  [ -d "$NM" ] || continue
  FOUND_NM=1; echo "-- $NM"
  node "$LIB/nm-scan.js" --dir "$NM" --allowlist "$ALLOW" --label installed --id-prefix 14
done < "$RUN_DIR/locks.txt"
[ "$FOUND_NM" -eq 0 ] && rec INFO 14a critical "Installed packages (installed): lifecycle scripts" "no node_modules present; run scan/contained-install.sh to install in a container and re-scan"

hdr "G. Code  [7a malicious] [7b needs a look] [7c inventory] [7d allowlisted] [8 external hosts] [16 exposure + tunnel host]"
VITE_CFGS=$(while IFS= read -r L; do d=$(dirname "$L"); for f in vite.config.ts vite.config.js vite.config.mts vite.config.mjs; do [ -f "$REPO/$d/$f" ] && printf '%s,' "$d/$f"; done; done < "$RUN_DIR/locks.txt")
node "$LIB/code-scan.js" --repo "$REPO" --allowlist "$ALLOW" --tunnel-host "$TUNNEL_HOST" --vite-config "${VITE_CFGS%,}" < "$RUN_DIR/files.txt"

hdr "H. Configuration and AI-agent surface  [17 .npmrc] [18 automation hooks] [19 agent settings] [20 prompt injection]"
# Agent settings are often git-ignored (settings.local.json), so add them from disk, outside node_modules.
{ cat "$RUN_DIR/files.txt"; find . -path '*/node_modules' -prune -o -path ./.git -prune -o \( \( -path '*/.claude/settings*.json' -o -name '.mcp.json' -o -path '*/.cursor/*' -o -path '*/.codex/*' \) -type f -print \) 2>/dev/null | sed 's|^\./||'; } | sort -u > "$RUN_DIR/files-cfg.txt"
node "$LIB/config-scan.js" --repo "$REPO" --allowlist "$ALLOW" < "$RUN_DIR/files-cfg.txt"

hdr "I. Archives  [22 zip contents] [26a code IOCs inside zips]"
ZIPS=$($GREP -iE '\.zip$' "$RUN_DIR/files.txt" || true)
if [ -z "$ZIPS" ]; then
  rec INFO 22 critical "Zip archives" "no zip files in the tree"
elif ! command -v unzip >/dev/null; then
  rec WARN 22 critical "Zip archives" "unzip not installed; cannot list $(echo "$ZIPS" | wc -l) archive(s)"
else
  : > "$RUN_DIR/zip.ev"; ZSTATUS=PASS; ZN=0; ZENTRIES=0; ZEXTRACTED=0; ZDIFF="$RUN_DIR/zipdiff.ev"; : > "$ZDIFF"
  while IFS= read -r Z; do
    ZN=$((ZN+1))
    SIZE=$(stat -c %s "$Z")
    # -Z (zipinfo) long listing: mode, size, date, name; symlinks start with 'l'.
    unzip -Z "$Z" 2>/dev/null | $GREP -E '^[-dl]' > "$RUN_DIR/zlist.txt" || true
    N=$(wc -l < "$RUN_DIR/zlist.txt"); ZENTRIES=$((ZENTRIES+N))
    echo "info $Z: $((SIZE/1024)) KB, $N entries" >> "$RUN_DIR/zip.ev"
    awk '{ $1=$1; n=""; for(i=9;i<=NF;i++) n=n (i>9?" ":"") $i; print n }' "$RUN_DIR/zlist.txt" > "$RUN_DIR/znames.txt"
    SYM=$($GREP -E '^l' "$RUN_DIR/zlist.txt" | awk '{print $NF}' || true)
    TRAV=$($GREP -E '(^|/)\.\.(/|$)|^/' "$RUN_DIR/znames.txt" || true)
    SENS=$($GREP -iE '(^|/)(\.env[^/]*|[^/]*\.(pem|key|p12|pfx)|id_rsa[^/]*|\.npmrc|\.netrc|credentials\.json|[^/]*\.sqlite3?)$' "$RUN_DIR/znames.txt" || true)
    NMOD=$($GREP -cE '(^|/)node_modules/' "$RUN_DIR/znames.txt" || true)
    GITD=$($GREP -cE '(^|/)\.git/' "$RUN_DIR/znames.txt" || true)
    EXEC=$($GREP -iE '\.(exe|dll|so|node|wasm|sh|bat|ps1|cmd)$' "$RUN_DIR/znames.txt" || true)
    [ -n "$TRAV" ] && { ZSTATUS=FAIL; echo "$TRAV" | sed "s|^|FAIL $Z path traversal/absolute entry: |" >> "$RUN_DIR/zip.ev"; }
    [ -n "$SYM" ] && { ZSTATUS=FAIL; echo "$SYM" | sed "s|^|FAIL $Z symlink entry: |" >> "$RUN_DIR/zip.ev"; }
    if [ -n "$SENS" ]; then
      echo "$SENS" | while IFS= read -r s; do case "$s" in *.npmrc) echo "info $Z contains $s (content checked after extraction / in [17] if same as repo)";; *) ZSTATUS=WARN; echo "WARN $Z contains sensitive-looking file: $s";; esac; done >> "$RUN_DIR/zip.ev"
      echo "$SENS" | $GREP -vq '\.npmrc$' && [ "$ZSTATUS" = PASS ] && ZSTATUS=WARN
    fi
    [ "${NMOD:-0}" -gt 0 ] && { [ "$ZSTATUS" = PASS ] && ZSTATUS=WARN; echo "WARN $Z ships $NMOD node_modules entries (pre-installed packages bypass the lockfile; never use them, reinstall from the lockfile)" >> "$RUN_DIR/zip.ev"; }
    [ "${GITD:-0}" -gt 0 ] && echo "info $Z contains a .git directory ($GITD entries)" >> "$RUN_DIR/zip.ev"
    [ -n "$EXEC" ] && echo "$EXEC" | sed "s|^|info $Z executable/binary entry: |" >> "$RUN_DIR/zip.ev"
    # Static inspection: extract into an empty scratch dir (never into the repo), only when the listing is clean.
    if [ "$QUICK" -eq 0 ] && [ -z "$TRAV" ] && [ -z "$SYM" ] && [ "$SIZE" -lt 209715200 ]; then
      XD="$RUN_DIR/zip-$ZN"; mkdir -p "$XD"
      if unzip -qq -n -d "$XD" "$Z" 2>"$RUN_DIR/unzip.err"; then
        ZEXTRACTED=$((ZEXTRACTED+1))
        # compare with the working tree: which files differ / are only in the zip / only in the repo
        for top in "$XD"/*/; do
          rel=${top#"$XD"/}; rel=${rel%/}
          [ -d "$REPO/$rel" ] || { echo "info $Z: top-level folder $rel/ has no counterpart in the repo" >> "$ZDIFF"; continue; }
          diff -rq --no-dereference -x node_modules -x dist -x .git "$top" "$REPO/$rel" 2>/dev/null \
            | sed -e "s|^Only in $XD/|ONLY-IN-ZIP  |" -e "s|^Only in $REPO/|ONLY-IN-REPO |" -e "s|^Files $XD/\([^ ]*\) and .* differ|DIFFERS      \1|" \
            | sed "s|^|$(basename "$Z"): |" | head -200 >> "$ZDIFF"
        done
        node "$LIB/code-scan.js" --repo "$REPO" --root "$XD" --fail-only --warn-too --allowlist "$ALLOW" --id-prefix 26 --label "$(basename "$Z")"
      else
        [ "$ZSTATUS" = PASS ] && ZSTATUS=WARN; echo "WARN $Z: could not extract for inspection: $(tail -1 "$RUN_DIR/unzip.err")" >> "$RUN_DIR/zip.ev"
      fi
    fi
  done <<< "$ZIPS"
  meta archives "{\"count\":$ZN,\"entries\":$ZENTRIES,\"extracted\":$ZEXTRACTED}"
  if [ -s "$ZDIFF" ]; then
    CNT=$(wc -l < "$ZDIFF"); echo "info zip vs working tree: $CNT differing path(s) listed below (ONLY-IN-ZIP / ONLY-IN-REPO / DIFFERS)" >> "$RUN_DIR/zip.ev"; cat "$ZDIFF" >> "$RUN_DIR/zip.ev"
  elif [ "$ZEXTRACTED" -gt 0 ]; then echo "info zip contents identical to the working tree (ignoring node_modules, dist, .git)" >> "$RUN_DIR/zip.ev"; fi
  rec "$ZSTATUS" 22 critical "Zip archives (listing, traversal, symlinks, sensitive entries, diff vs tree)" "$ZN archive(s), $ZENTRIES entries, $ZEXTRACTED extracted to scratch for static inspection" "$RUN_DIR/zip.ev"
fi

hdr "J. Git history  [23 secrets in history] [24 sensitive files ever added/deleted] [25 large objects]"
COMMITS=$(git rev-list --all --count 2>/dev/null || echo 0)
SECRET_RE='AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,}|npm_[A-Za-z0-9]{36}|sk-(ant-)?[A-Za-z0-9_-]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|(sk|rk)_live_[0-9a-zA-Z]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|(postgres(ql)?|mysql|mongodb(\+srv)?|redis)://[^:[:space:]/]+:[^@[:space:]/]+@|_authToken=|(api[_-]?key|secret|password|token)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"'[:space:]]{12,}["'"'"']'
if [ "$QUICK" -eq 1 ]; then
  rec SKIP 23 critical "Secrets in git history" "--quick"
  meta git "{\"commits\":$COMMITS,\"patchBytes\":0}"
else
  git log -p --all --max-count=400 --no-color -- . ':(exclude)**/package-lock.json' ':(exclude)*.zip' ':(exclude)security-scan.sh' ':(exclude)scan/selftest.sh' 2>/dev/null | head -c 80000000 > "$RUN_DIR/history.patch"
  PB=$(stat -c %s "$RUN_DIR/history.patch")
  meta git "{\"commits\":$COMMITS,\"patchBytes\":$PB}"
  $GREP -nE '^\+' "$RUN_DIR/history.patch" | $GREP -vE '^\+\+\+ ' | $GREP -E "$SECRET_RE" | $GREP -vE 'example|placeholder|your[-_]?api|process\.env|\$\{|xxxx|security-scan\.sh|scan/lib/' | sed -E 's/(["'"'"'])([^"'"'"']{4})[^"'"'"']*([^"'"'"']{2})(["'"'"'])/\1\2…\3\4/g' | cut -c1-200 | head -50 > "$RUN_DIR/hist.ev" || true
  if [ -s "$RUN_DIR/hist.ev" ]; then rec FAIL 23 critical "Secrets in git history" "$(wc -l < "$RUN_DIR/hist.ev") added line(s) in history look like credentials (still retrievable even if deleted later)" "$RUN_DIR/hist.ev"
  else rec PASS 23 critical "Secrets in git history" "no credential-shaped strings added in the last 400 commits ($COMMITS total, $((PB/1024)) KB of patches; our own security-scan.sh and scan/selftest.sh are left out because they hold the fake test keys and the key patterns)"; fi
fi
git log --all --diff-filter=D --name-only --pretty=format: 2>/dev/null | $GREP -v '^$' | sort -u > "$RUN_DIR/deleted.txt" || true
git log --all --diff-filter=A --name-only --pretty=format: 2>/dev/null | $GREP -v '^$' | sort -u > "$RUN_DIR/added.txt" || true
SENS_HIST=$($GREP -iE '(^|/)(\.env[^/]*|[^/]*\.(pem|key|p12|pfx)|id_rsa[^/]*|\.netrc|credentials\.json|[^/]*\.sqlite3?)$' "$RUN_DIR/added.txt" "$RUN_DIR/deleted.txt" 2>/dev/null | sed 's|^.*/\(added\|deleted\)\.txt:|\1 |' || true)
{ [ -n "$SENS_HIST" ] && echo "$SENS_HIST" | sed 's/^/WARN /'; sed 's/^/info deleted at some point: /' "$RUN_DIR/deleted.txt" | head -40; } > "$RUN_DIR/hist2.ev"
if [ -n "$SENS_HIST" ]; then rec WARN 24 critical "Sensitive files ever committed (added or deleted)" "$(echo "$SENS_HIST" | wc -l) sensitive-looking path(s) exist in history" "$RUN_DIR/hist2.ev"
else rec PASS 24 critical "Sensitive files ever committed (added or deleted)" "none; $(wc -l < "$RUN_DIR/deleted.txt") file(s) were deleted over the history (listed)" "$RUN_DIR/hist2.ev"; fi
git rev-list --objects --all 2>/dev/null | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' 2>/dev/null \
  | awk '$1=="blob" && $3>1048576 {printf "info %.1f MB %s (%s)\n", $3/1048576, $4, substr($2,1,10)}' | sort -k2 -rn | head -30 > "$RUN_DIR/big.ev" || true
BIGN=$(wc -l < "$RUN_DIR/big.ev")
rec INFO 25 hygiene "Large objects in git history (>1 MB)" "$BIGN blob(s); large binaries in history cannot be reviewed by reading and stay downloadable forever" "$RUN_DIR/big.ev"

hdr "Report"
export LIB_DIR="$LIB"
node "$LIB/report.js" --results "$SCAN_RESULTS" --meta "$SCAN_META" --out-md "$REPORT_MD" --out-json "$REPORT_JSON" --allowlist "$ALLOW" --repo "$REPO" --stamp "$(date -Is)" --options "$(IFS=,; echo "${OPTS[*]:-}")"
RC=$?
if [ "$RC" -eq 0 ]; then echo "No FAIL. Read the WARN items in the report, then install only via scan/contained-install.sh."; else echo "NOT OK: a FAIL fired. Do not install or launch until it is understood."; fi
exit "$RC"

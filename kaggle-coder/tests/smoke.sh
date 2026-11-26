#!/usr/bin/env bash
# Smoke test for the Kaggle coding server. Corey only, on Ubuntu.
# Usage:  bash kaggle-coder/tests/smoke.sh https://<words>.trycloudflare.com
#
# The key is NEVER a command-line argument (that would land in shell history and in `ps`).
# Either it is in the environment variable CODER_KEY, set without echoing it:
#     read -rs CODER_KEY; export CODER_KEY
# or, if CODER_KEY is empty, the script asks for it with hidden input.
#
# Checks: /health answers; without the key, models and chat give 401 and /, /index.html,
# /props, /slots, /metrics are not 200; with the key the model is "kaggle-coder", a
# stream:false chat answers, a tool call is parsed (information only), and a ~12k-token prompt
# with a ~800-token answer finishes in under 100 seconds through the tunnel.
# The model's text is only printed, never run. Not tested yet.
set -euo pipefail

BASE="${1:-}"
BASE="${BASE%/}"; BASE="${BASE%/v1}"
if [[ ! "$BASE" =~ ^https://[a-z0-9-]+\.trycloudflare\.com$ ]]; then
  echo "usage: bash $0 https://<words>.trycloudflare.com   (key in CODER_KEY or typed when asked)" >&2; exit 2
fi

K="${CODER_KEY:-}"
if [ -z "$K" ]; then read -r -s -p "Paste the key (hidden), then Enter: " K; echo; fi
if [ "${#K}" -lt 32 ]; then echo "key is shorter than 32 characters" >&2; exit 2; fi

T=$(mktemp -d); chmod 700 "$T"
trap 'rm -rf "$T"' EXIT
printf 'Authorization: Bearer %s\n' "$K" > "$T/auth"; chmod 600 "$T/auth"
unset K CODER_KEY

pass=0; fail=0
ok()   { echo "PASS  $1"; pass=$((pass+1)); }
bad()  { echo "FAIL  $1"; fail=$((fail+1)); }
info() { echo "INFO  $1"; }
code() { curl -sS -o "$T/body" -w '%{http_code}' --max-time 30 "$@" || true; }
post() { curl -sS -o "$T/body" -w '%{http_code}' --max-time "$1" -H @"$T/auth" \
           -H 'Content-Type: application/json' -X POST "$BASE/v1/chat/completions" --data-binary @"$2" || true; }

# ---- without the key ----
c=$(code "$BASE/health");                [ "$c" = 200 ] && ok "/health answers 200" || bad "/health gave $c"
c=$(code "$BASE/v1/models");             [ "$c" = 401 ] && ok "/v1/models without key -> 401" || bad "/v1/models without key gave $c (must be 401)"
c=$(code -X POST "$BASE/v1/chat/completions" -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}')
[ "$c" = 401 ] && ok "chat without key -> 401" || bad "chat without key gave $c (must be 401)"
for p in / /index.html /props /slots /metrics; do
  c=$(code "$BASE$p");                   [ "$c" != 200 ] && ok "GET $p without key -> $c (not 200)" || bad "GET $p without key gave 200"
done

# ---- with the key ----
c=$(code -H @"$T/auth" "$BASE/v1/models")
if [ "$c" = 200 ] && grep -q '"kaggle-coder"' "$T/body"; then ok "/v1/models with key lists kaggle-coder"; else bad "/v1/models with key gave $c or no kaggle-coder"; fi

printf '%s' '{"model":"kaggle-coder","stream":false,"max_tokens":64,"messages":[{"role":"user","content":"Write a JavaScript function that adds two numbers. Code only."}]}' > "$T/small.json"
c=$(post 120 "$T/small.json")
if [ "$c" = 200 ] && jq -e '.choices[0].message.content | length > 0' "$T/body" >/dev/null 2>&1; then
  ok "stream:false chat answered"
  echo "      answer starts: $(jq -r '.choices[0].message.content' "$T/body" | head -c 120 | tr '\n' ' ')"
else
  bad "stream:false chat gave $c"
fi

# ---- tool call (information only: Aider does not use tool calls) ----
cat > "$T/tool.json" <<'JSON'
{"model":"kaggle-coder","stream":false,"max_tokens":200,
 "tools":[{"type":"function","function":{"name":"read_file","description":"Read a text file from the project",
   "parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}}}],
 "messages":[{"role":"user","content":"Use the read_file tool to read src/main.tsx."}]}
JSON
c=$(post 120 "$T/tool.json")
if [ "$c" = 200 ] && jq -e '.choices[0].message.tool_calls | length > 0' "$T/body" >/dev/null 2>&1; then
  info "tool call parsed: $(jq -c '.choices[0].message.tool_calls[0].function' "$T/body" | head -c 160)"
else
  info "no parsed tool call (status $c)"
fi

# ---- about 12k tokens in, about 800 out, timed end to end (token count is an estimate) ----
{
  printf '{"model":"kaggle-coder","stream":false,"max_tokens":800,"messages":[{"role":"user","content":"'
  for i in $(seq 1 700); do printf 'function f%d(a, b) { return a * %d + b; }\\n' "$i" "$i"; done
  printf 'List the names of the first 60 functions above, one per line, then say how many there are in total."}]}'
} > "$T/big.json"
start=$(date +%s)
c=$(post 180 "$T/big.json")
secs=$(( $(date +%s) - start ))
if [ "$c" = 200 ] && [ "$secs" -lt 100 ]; then
  ok "large prompt answered in ${secs}s (prompt tokens: $(jq -r '.usage.prompt_tokens // "?"' "$T/body"))"
else
  bad "large prompt: status $c after ${secs}s (fail at 100s or more; 524 = tunnel time limit)"
fi

echo "----"; echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ] || { echo "Do not use this address. Stop the Kaggle session."; exit 1; }
echo "No indicators found by these checks. They cannot show that the key has stayed secret or that the tunnel is private."

#!/usr/bin/env bash
# deploy/verify-live.sh - after a swap: is the live container what we built, locked down, and reachable?
# Read-only. Exit 1 if anything needs a look. Not a scan; the scan is ./security-scan.sh.
set -u
unset -f grep 2>/dev/null
GREP=/usr/bin/grep
SITE=https://signal.gamelab.link
BAD=0; bad() { echo "  !! $*"; BAD=1; }; ok() { echo "  ok $*"; }

echo "Deploy alignment"
S=$(docker inspect -f '{{.State.Running}} {{.HostConfig.ReadonlyRootfs}} {{.Config.User}} {{.Image}}' signal-below 2>/dev/null) || { bad "container signal-below not found"; exit 1; }
set -- $S
[ "$1" = true ] && ok "signal-below is running" || bad "signal-below is not running"
[ "$2" = true ] && [ "$3" = 101 ] && ok "read-only filesystem, non-root user 101" || bad "hardening differs (read-only=$2 user=$3)"
docker port signal-below 8080/tcp 2>/dev/null | $GREP -q '^0\.0\.0\.0:5173' && ok "published on all interfaces, port 5173" || bad "port 5173 not published on 0.0.0.0 (the tunnel would 502)"
[ "$4" = "$(docker image inspect -f '{{.Id}}' signal-below:new 2>/dev/null)" ] && ok "running image is signal-below:new" || bad "running image is not signal-below:new (tags out of step)"
docker image inspect signal-below:prev >/dev/null 2>&1 && ok "rollback image signal-below:prev exists" || bad "no signal-below:prev for rollback"
docker ps -a --format '{{.Names}}' | $GREP -qx signal-below-stage && bad "staging container signal-below-stage still exists" || ok "no leftover staging container"
systemctl --user is-active signal-web.service >/dev/null 2>&1 && bad "old signal-web.service is active (must stay disabled)" || ok "old signal-web.service is not running"
for p in / /docs/; do c=$(curl -s -o /dev/null -w '%{http_code}' "$SITE$p"); [ "$c" = 200 ] && ok "$SITE$p is 200" || bad "$SITE$p returned $c"; done
JS=$(curl -s "$SITE/" | $GREP -o '/assets/index-[^"]*\.js' | head -1)
LOCAL=$(curl -s http://127.0.0.1:5173/ | $GREP -o '/assets/index-[^"]*\.js' | head -1)
[ -n "$JS" ] && [ "$JS" = "$LOCAL" ] && ok "public site serves the same build as the container ($JS)" || bad "public ($JS) and container ($LOCAL) serve different builds"
if [ -n "$JS" ]; then curl -s -o /dev/null "$SITE$JS"; H=$(curl -s -o /dev/null -D - "$SITE$JS" | $GREP -i '^cf-cache-status' | tr -d '\r' | awk '{print $2}'); [ "$H" = HIT ] && ok "Cloudflare is warm (HIT)" || bad "Cloudflare cache status is '$H', not HIT (request the asset once more)"; fi
echo; [ "$BAD" -eq 0 ] && echo "Result: deploy matches what we built." || echo "Result: needs a look."
exit "$BAD"

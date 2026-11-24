---
description: After a deploy and smoke test, draft the README "What's new" entry for the friends and the son
---
Run this after `/scan-new-zip` is done: scanned, deployed, `deploy/verify-live.sh` passed, smoke test ok.
Optional argument: $ARGUMENTS = a nickname for the release. The README is ours (repo root); his code is never edited.
P = project-bolt-stackblitz-starters-kppnjtxg/project

1. Version. Read the new label from `$P/src/App.tsx` and `$P/src/components/BuriedComplexGame.tsx`
   (the `vN.N` text). Compare with the top entry under "## 📰 What's new" in README.md.
   Same version, or no label: STOP and ask Corey what to call this release.
2. What changed. `git diff HEAD -- $P/src` (the update is not committed yet). Keep only what a player sees:
   - version labels; boss, enemy and item names, titles, ability labels and lore; unlock notes;
   - on-screen text in the JSX; controls (key maps); new art or sound files in `src/lib/`.
   Anything that already existed before this diff is NOT new. Say nothing about code structure, packages,
   or the scan.
3. Loot math. If `rollRarity` (bonus, cap or thresholds) changed in `deep-signal-engine.ts`, recompute the
   README loot table from the formula (a quick script) and fix the "can't drop until floor N" line.
   If it did not change, leave the table alone.
4. Draft the entry at the TOP of "What's new" (newest first), keep the older ones:
   `### vN.N · Nickname` then up to 7 bullets.
   Voice: teen, short, one emoji to lead each line, 6 to 10 words, say what it does for the player
   ("Get close and they bail"), name specifics ("Floor 30: the Flyer Matriarch"), at most one joke per
   release. Never blame, never list bugs that made the last version look bad. Every bullet must be backed by
   the diff; if you are not sure, leave it out.
5. Touch the other README sections only if the diff changes them: Controls, "What you're in for", "Where
   things live" (a new file in `src/lib/`). Leave the "Dadlorian Rules" appendix alone.
   The README is public: no ports, hostnames, tokens, container or scan details. No key-shaped strings.
6. Show Corey the entry and the README diff. Wait for approval; offer to let the son add a "dev note" line
   in his own words. Do not scan again for this. When Corey says to, commit (his files, README, the day's one
   report) so this becomes the new baseline. Do not push unless asked: the GitHub repo is public.

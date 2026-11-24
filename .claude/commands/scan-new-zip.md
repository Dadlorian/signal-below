---
description: Check a new zip of the game: one scan, one report, a plain verdict for Corey
---
Zip: $ARGUMENTS (a file at the repo root). Rules in CLAUDE.md apply. Never run his code, npm or vite on the host.
P = project-bolt-stackblitz-starters-kppnjtxg/project. Ours inside P: UPDATE-INSTRUCTION.md, GAME_SPEEDUP.md, docs/.
The "baseline" is git HEAD: the last update Corey accepted (committed).

0. `git status --porcelain -- $P` must show nothing except UPDATE-INSTRUCTION.md. If it does, STOP: the last
   update was never accepted; ask Corey to commit or discard it first. If other *.zip files sit at the repo root
   (outside `zips/`), STOP and ask to move them there: every root zip is scanned.
1. Scan first, nothing overlaid. Run `./security-scan.sh` once. The zip is extracted to scratch and read, never run.
   Read `reports/latest.json`: verdict, failIds, criticalWarnIds, hygieneWarnIds.
   - HIGH / any FAIL: STOP. Tell Corey which check fired and the file:line. Do not overlay, install or launch.
2. What is new vs baseline: the report's check [22] (`DIFFERS` / `ONLY-IN-ZIP`) and check [12] (packages
   added / changed in the lockfile). Flag any change to package.json, package-lock.json, vite.config.ts,
   index.html, .npmrc, .replit*, scripts/, *.sh, tsconfig*, .agents/, and any new file type.
3. NEW-THING review (MEDIUM verdict, or anything flagged in step 2): for each new package / host / script /
   file type / config setting, follow "New things" in scan/README.md and get an MM3 verdict (cite MM3-####).
   STOP before overlaying; Corey decides. If accepted, add one dated line to scan/allowlist.txt (a new package
   needs none: accepting it means committing its lockfile), then re-run step 1 once and delete the superseded report.
4. OK (LOW, or MEDIUM with nothing new): overlay his files onto $P (copy, never edit them; keep our files).
   Then `.npmrc`: if its text is in `.npmrc.txt` and has no registry= / _authToken / ignore-scripts / strict-ssl,
   write the two approved comment lines from UPDATE-INSTRUCTION.md; otherwise leave it and flag it.
5. `scan/contained-install.sh` must end "no FAIL-level indicators". Else STOP.
6. Staging build on 127.0.0.1:5175 (docker block in UPDATE-INSTRUCTION.md); `/` and `/docs/` must return 200;
   then `docker rm -f signal-below-stage`.
7. Report to Corey in plain language: (a) verdict OK / NEW-THING-NEEDS-REVIEW / FAIL, one line why;
   (b) what is new: files, packages, hosts, flagged paths, each with the finding; (c) the report path;
   (d) what a static scan cannot rule out, one line. Never say "safe". Ask before swapping.
8. After Corey approves the swap (UPDATE-INSTRUCTION.md), run `deploy/verify-live.sh` and a quick smoke
   test of the live site. Then run `/whats-new` (drafts the README "What's new" entry; Corey approves it).
   When Corey says to, commit; that becomes the new baseline. Move the zip into `zips/` and add one
   change-log line.
Keep ONE report per day in reports/ (delete the day's earlier ones). Do not add scripts, tools or docs.

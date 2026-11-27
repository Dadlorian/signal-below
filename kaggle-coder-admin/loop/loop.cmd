@echo off
rem ===========================================================================
rem  loop.cmd  -  THE LOOP:  IDEA  >  DESIGN  >  CODE  >  TEST  >  PUSH
rem
rem  One command per step. Every git / npm command is PRINTED before it runs,
rem  so you learn the real commands. Read this file: it is meant to be read.
rem
rem  Rules this script keeps:
rem   - it never prints or saves a key
rem   - it never runs a command the AI suggested (it only runs the commands below)
rem   - it never uses "npm install" and never adds packages
rem   - it never serves the game to the network (127.0.0.1 only)
rem
rem  Install: copy to %USERPROFILE%\.local\bin\ next to start-helper.cmd.
rem  Run it from the game folder (the one with the .git folder).
rem  Not tested yet [test this first]: cmd cannot be run where this was written.
rem ===========================================================================
setlocal EnableExtensions EnableDelayedExpansion

rem ---- Colours: ANSI escape codes. Windows 11 terminals understand them.
rem      Set NO_COLOR=1 to switch them off (plain text).  [test this first]
set "ESC="
if not defined NO_COLOR for /f %%e in ('echo prompt $E^| cmd') do set "ESC=%%e"
set "CG=" & set "CY=" & set "CR=" & set "CC=" & set "CM=" & set "C0="
if defined ESC (
  set "CG=%ESC%[92m" & set "CY=%ESC%[93m" & set "CR=%ESC%[91m"
  set "CC=%ESC%[96m" & set "CM=%ESC%[95m" & set "C0=%ESC%[0m"
)

set "CMD=%~1"
if "%CMD%"=="" set "CMD=help"
if /i "%CMD%"=="help" goto help

rem ---- Everything else needs git and must start in the game folder.
where git >nul 2>nul || (echo !CR!git is not installed. See the README, Part 1.!C0! & exit /b 2)
if not exist ".git\" (
  echo !CR!Start me from the game folder: the one that has a .git folder in it.!C0!
  exit /b 2
)
for /f "delims=" %%b in ('git branch --show-current') do set "BR=%%b"

if /i "%CMD%"=="idea"   goto idea
if /i "%CMD%"=="design" goto design
if /i "%CMD%"=="code"   goto code
if /i "%CMD%"=="test"   goto test
if /i "%CMD%"=="setup"  goto setup
if /i "%CMD%"=="push"   goto push
if /i "%CMD%"=="status" goto status
if /i "%CMD%"=="undo"   goto undo
echo !CR!Unknown command: %CMD%!C0!
goto help

rem ===========================================================================
:help
call :banner
echo   loop idea ^<name^>     [1/5 IDEA]    new branch v-^<name^> + a 5-line plan note
echo   loop design [addr]    [2/5 DESIGN]  ask the helper questions. It cannot edit.
echo   loop code [addr]      [3/5 CODE]    the helper edits, only after you say yes
echo   loop test             [4/5 TEST]    build, Rule 2 check, local-only preview
echo   loop push             [5/5 PUSH]    commit, push your branch, open a pull request
echo.
echo   loop setup            first time only: npm ci --ignore-scripts from the lockfile
echo   loop status           where am I in the loop?
echo   loop undo             take back the helper's last change
echo.
echo   [addr] = today's address from your Kaggle notebook. Or set it once per window:
echo     cmd:         set KC_URL=https://some-random-words.trycloudflare.com
echo     PowerShell:  $env:KC_URL="https://some-random-words.trycloudflare.com"
exit /b 0

rem ===========================================================================
:idea
echo !CM![1/5 IDEA]!C0!
set "LOOPNAME=%~2"
if "!LOOPNAME!"=="" (echo Usage: loop idea boss-flash   -- lowercase letters, digits and - only & exit /b 2)
rem "set LOOPNAME" prints LOOPNAME=value; findstr checks it is only a-z, 0-9 and -.
set LOOPNAME | findstr /r /x /c:"LOOPNAME=[abcdefghijklmnopqrstuvwxyz0123456789-][abcdefghijklmnopqrstuvwxyz0123456789-]*" >nul || (
  echo Name must be lowercase letters, digits and - only. Example: boss-flash
  exit /b 2
)
call :need_clean || exit /b 1
call :run git switch main || exit /b 1
call :run git pull --ff-only || exit /b 1
call :run git switch -c v-!LOOPNAME! || exit /b 1
rem The plan note lives in ideas\ at the repo root. NOT docs\: docs\ is copied onto the live site.
if not exist "ideas\" mkdir ideas
if exist "ideas\!LOOPNAME!.md" goto idea_done
> "ideas\!LOOPNAME!.md" echo # Idea: !LOOPNAME!
>>"ideas\!LOOPNAME!.md" echo - What: (fill me in)
>>"ideas\!LOOPNAME!.md" echo - Why: (fill me in)
>>"ideas\!LOOPNAME!.md" echo - Which file: (fill me in)
>>"ideas\!LOOPNAME!.md" echo - How I'll test: (fill me in)
>>"ideas\!LOOPNAME!.md" echo - What could break: (fill me in)
:idea_done
echo !CG!Branch v-!LOOPNAME! is ready. Plan note: ideas\!LOOPNAME!.md!C0!
echo Next: open the note, then  loop design
call :progress
exit /b 0

rem ===========================================================================
:design
echo !CM![2/5 DESIGN]!C0!  Ask-only mode: the helper answers, it cannot edit files.
echo Ask: "How would I do what ideas\!BR:~2!.md says? Which function?" Then write the plan in the note.
echo Do not type /code or /architect here: use  loop code  when you are ready.
call :not_main || exit /b 1
call :get_url "%~2" || exit /b 2
call :run start-helper "!URL!" ask
exit /b %ERRORLEVEL%

rem ===========================================================================
:code
echo !CM![3/5 CODE]!C0!  The helper shows a plan and asks "Edit the files?". Read, then y or n.
echo One small task. /add only the 1-2 files you need, each under about 400 lines.
echo After each edit: /diff to read it, /undo if it is wrong. Never /run, /test, /lint, /web.
call :not_main || exit /b 1
call :get_url "%~2" || exit /b 2
call :run start-helper "!URL!"
exit /b %ERRORLEVEL%

rem ===========================================================================
:setup
echo !CM![SETUP]!C0!  Install the game's packages exactly as the lockfile lists them.
if not exist "package-lock.json" (echo !CR!No package-lock.json here. Ask Corey.!C0! & exit /b 2)
rem Only install from a lockfile Corey approved: refuse if package files differ from main.
git diff --quiet origin/main -- package.json package-lock.json 2>nul || (
  echo !CR!package.json or the lockfile differ from main. Rule 1 moment: ask Corey first.!C0!
  exit /b 1
)
echo --ignore-scripts = packages may not run their own install scripts on your laptop.
call :run npm ci --ignore-scripts || exit /b 1
echo !CG!Setup done. Next: loop test!C0!
exit /b 0

rem ===========================================================================
:test
echo !CM![4/5 TEST]!C0!
if not exist "node_modules\" (echo First time? Run  loop setup  first. & exit /b 2)

rem -- Rule 1: did the package list change on this branch?
set "PKG="
for /f %%f in ('git diff --name-only main...HEAD -- package.json package-lock.json') do set "PKG=1"
for /f %%f in ('git status --porcelain -- package.json package-lock.json') do set "PKG=1"
if defined PKG echo !CY!WARNING: package.json or the lockfile changed. Rule 1: ask Corey before you push.!C0!

rem -- Rule 2: text turned into code. Each hit: is the right side a VARIABLE? Then ask Corey.
echo !CC!^> git grep -n -E -e "eval *\(" -e "new Function *\(" -e "innerHTML" -- src!C0!
git grep -n -E -e "eval *\(" -e "new Function *\(" -e "innerHTML" -- src
if errorlevel 1 (
  echo !CG!Rule 2: no eval / new Function / innerHTML in src.!C0!
) else (
  echo !CY!Rule 2 hits above. Constant text is usually fine. A VARIABLE on the right is a stop: ask Corey.!C0!
)

rem -- Build. This runs vite.config.ts and its plugins: your own project's code.
call :run npm run build || (echo !CR!Build failed. Read the first red line: it is a clue.!C0! & exit /b 1)

rem -- Remember which commit was tested: one line inside .git (git never commits .git).
rem    If HEAD moves (a new helper edit), the TEST tick goes away until you test again.
for /f %%h in ('git rev-parse HEAD') do > ".git\loop-tested" echo %%h
call :progress

rem -- Preview on THIS computer only. Not "npm run dev": that one runs Vite with the --host flag = whole network.
echo !CG!Open http://127.0.0.1:4173 and play. Ctrl+C stops the preview.!C0!
call :run npx --no-install vite preview --host 127.0.0.1 --port 4173 --strictPort
exit /b 0

rem ===========================================================================
:push
echo !CM![5/5 PUSH]!C0!
call :not_main || exit /b 1
call :run git status --short
choice /c yn /n /m "Add ALL of these changes? [y/n] "
if errorlevel 2 (echo Nothing added. & exit /b 1)
call :run git add -A
rem -- Key files must never be committed.
rem    (git pathspecs: "*" matches any folder too, so "*/.env*" finds a .env anywhere)
set "BAD="
for /f "delims=" %%f in ('git diff --cached --name-only -- ".env*" "*/.env*" ".aider*" "*/.aider*" "*kaggle.json" "*access_token" "*.key" "*.pem" "*id_rs[a]*" "*id_ed2551[9]*"') do set "BAD=%%f"
if defined BAD (
  echo !CR!STOP: a key or helper-config file is staged: !BAD!. Unstaging everything. Ask Corey.!C0!
  git reset -q
  exit /b 1
)
rem -- Key NAMES or a tunnel address inside the changes: also a stop. Nothing is printed.
git diff --cached -U0 | findstr /i /c:"CODER_API_KEY" /c:"OPENAI_API_KEY" /c:"KAGGLE_API_TOKEN" /c:"KAGGLE_KEY" /c:"access_token" /c:"trycloudflare.com" >nul && (
  echo !CR!STOP: your changes mention a key name or a tunnel address. Unstaging. Ask Corey.!C0!
  git reset -q
  exit /b 1
)
call :run git diff --cached --stat
choice /c yn /n /m "Commit and push this? [y/n] "
if errorlevel 2 (echo Not pushed. Your changes are still staged. & exit /b 1)
set "MSG="
set /p "MSG=Commit message, short, no quotes: "
if "!MSG!"=="" set "MSG=!BR!: work in progress"
set "MSG=!MSG:"='!"
git diff --cached --quiet || call :run git commit -m "!MSG!" || exit /b 1
call :run git push -u origin !BR! || (echo !CR!Push failed. Read the message above, then ask Corey.!C0! & exit /b 1)
rem -- Turn the remote address into the GitHub pull-request link.
for /f "delims=" %%r in ('git remote get-url origin') do set "REPO=%%r"
set "REPO=!REPO:git@github.com:=https://github.com/!"
set "REPO=!REPO:.git=!"
echo.
echo !CG!  ==================  MISSION COMPLETE  ==================!C0!
echo   Branch !BR! is on GitHub. Open your pull request here:
echo   !CC!!REPO!/compare/main...!BR!?expand=1!C0!
echo   Then: checks run, Corey reviews. RED CHECK = a clue, not a punishment.
call :progress
exit /b 0

rem ===========================================================================
:status
call :banner
echo   Branch: !CC!!BR!!C0!
call :progress
echo.
call :run git status --short
if /i not "!BR!"=="main" call :run git diff --stat main...HEAD
exit /b 0

rem ===========================================================================
:undo
echo !CM![UNDO]!C0!
echo Inside the helper, type /undo : it takes back the helper's last commit.
echo Out here, the gentle undo is "git revert": it adds a NEW commit that reverses the last one,
echo so nothing is lost and it still works after a push.
rem (git log is printed and run directly: its %%h codes would be mangled by "call")
echo !CC!^> git log -3 --format="%%h  %%an  %%s"!C0!
git log -3 --format="%%h  %%an  %%s"
set "LASTAUTHOR="
for /f "delims=" %%a in ('git log -1 --format^=%%an') do set "LASTAUTHOR=%%a"
rem Aider marks its own commits with "(aider)" in the author name.
set LASTAUTHOR | findstr /c:"(aider)" >nul || (echo The last commit is not the helper's. Nothing undone. Ask Corey if stuck. & exit /b 1)
call :need_clean || exit /b 1
choice /c yn /n /m "Revert the helper's last commit? [y/n] "
if errorlevel 2 exit /b 1
call :run git revert --no-edit HEAD
exit /b %ERRORLEVEL%

rem ===========================================================================
rem  Helpers
rem ===========================================================================

:run
rem Print the command in cyan, then run it. "call" lets npm and start-helper (.cmd files)
rem come back to this script when they finish.
echo !CC!^> %*!C0!
call %*
exit /b %ERRORLEVEL%

:need_clean
git status --porcelain | findstr /r "." >nul && (
  echo !CY!You have unsaved work. Finish it first: loop push, or ask Corey about "git stash".!C0!
  exit /b 1
)
exit /b 0

:not_main
if /i "!BR!"=="main" (
  echo !CR!You are on main. Start with: loop idea ^<name^>!C0!
  exit /b 1
)
exit /b 0

:get_url
set "URL=%~1"
if "!URL!"=="" set "URL=!KC_URL!"
if "!URL!"=="" set /p "URL=Paste today's address from YOUR Kaggle notebook: "
if "!URL!"=="" exit /b 1
exit /b 0

:progress
rem Each tick comes from the repo itself, no extra database:
rem  IDEA   = on a v-* branch          DESIGN = the plan note no longer says "(fill me in)"
rem  CODE   = commits ahead of main     TEST   = .git\loop-tested holds the current commit
rem  PUSH   = GitHub has this exact commit
set "P1=[ ]" & set "P2=[ ]" & set "P3=[ ]" & set "P4=[ ]" & set "P5=[ ]"
if /i "!BR:~0,2!"=="v-" set "P1=[x]"
set "IDEAFILE=ideas\!BR:~2!.md"
if exist "!IDEAFILE!" findstr /c:"(fill me in)" "!IDEAFILE!" >nul || set "P2=[x]"
if not exist "!IDEAFILE!" set "P2=[ ]"
for /f %%n in ('git rev-list --count main..HEAD 2^>nul') do if %%n gtr 0 set "P3=[x]"
for /f %%h in ('git rev-parse HEAD') do set "HEAD=%%h"
if exist ".git\loop-tested" for /f %%t in (.git\loop-tested) do if "%%t"=="!HEAD!" set "P4=[x]"
for /f %%r in ('git rev-parse --verify --quiet origin/!BR! 2^>nul') do if "%%r"=="!HEAD!" set "P5=[x]"
echo   !CG!!P1! IDEA  !P2! DESIGN  !P3! CODE  !P4! TEST  !P5! PUSH!C0!
exit /b 0

:banner
echo !CC!  _      ___    ___    ___
echo  ^| ^|    / _ \  / _ \  ^| _ \
echo  ^| ^|__ ^| (_) ^|^| (_) ^| ^|  _/
echo  ^|____^| \___/  \___/  ^|_^|   IDEA ^> DESIGN ^> CODE ^> TEST ^> PUSH!C0!
echo.
exit /b 0

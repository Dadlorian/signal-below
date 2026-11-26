@echo off
rem ===========================================================================
rem  setup-tools.cmd   *** UNTESTED - it could not be run where it was written ***
rem
rem  OPTIONAL helper for SETUP-NO-ADMIN.md. Installs, for THIS Windows user only:
rem    VS Code (portable ZIP), Git (PortableGit), Node.js (ZIP), and with "with-aider" uv.
rem  How it works, so you can read along:
rem    1. refuses to run "as administrator" (it never needs it)
rem    2. downloads each file with curl.exe (built into Windows) from the pinned official URL
rem    3. checks its sha256 with certutil (built in) BEFORE unpacking. Wrong hash = stop.
rem    4. unpacks with tar.exe (built in) into %LOCALAPPDATA%\kc-tools
rem    5. adds the tool folders to YOUR user Path (never the system Path), only if missing
rem  It prints every command before running it. It never runs a downloaded installer.
rem  Pins (URL + sha256) must match kaggle\PINS.md, "Windows tools". [test this first]
rem
rem  Use:  setup-tools            (VS Code, Git, Node)
rem        setup-tools with-aider (the same, plus uv for the Aider helper)
rem ===========================================================================
setlocal EnableExtensions EnableDelayedExpansion

set "TOOLS=%LOCALAPPDATA%\kc-tools"
set "DL=%TOOLS%\downloads"

rem ---- 1. Never elevated. "High" integrity (S-1-16-12288) means "Run as administrator".
whoami /groups | findstr /c:"S-1-16-12288" >nul && (
  echo STOP: this window is running as administrator. Close it, open a normal one, try again.
  exit /b 3
)
rem ---- The tools folder must be inside your own user profile.
set "REST=!TOOLS:%USERPROFILE%=!"
if "!REST!"=="!TOOLS!" (
  echo STOP: %TOOLS% is not inside %USERPROFILE%. Ask Corey.
  exit /b 3
)
rem ---- Built-in tools we rely on.
for %%t in (curl.exe tar.exe certutil.exe powershell.exe) do (
  where %%t >nul 2>nul || (echo STOP: %%t was not found. Ask Corey. & exit /b 2)
)
if not exist "%DL%\" mkdir "%DL%"

rem ===========================================================================
rem  PINS  (name, url, sha256, file)  -  copied from kaggle\PINS.md
rem ===========================================================================
set "VSC_URL=https://vscode.download.prss.microsoft.com/dbazure/download/stable/69047191fc427f2f92828279aae1d90d8eeda7ab/VSCode-win32-x64-1.146.0.zip"
set "VSC_SHA=0d47f5bbff72499c6a4a92f6d72dd8cc5ba4606185f624465032626614119d61"
set "VSC_FILE=VSCode-win32-x64-1.146.0.zip"

set "GIT_URL=https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/PortableGit-2.56.1-64-bit.7z.exe"
set "GIT_SHA=9dd04a608ceb5f6ab32a73709e0ecb159d211da71b697c45ff81f6dd0c6b49c7"
set "GIT_FILE=PortableGit-2.56.1-64-bit.7z.exe"

set "NODE_URL=https://nodejs.org/dist/v26.13.1/node-v26.13.1-win-x64.zip"
set "NODE_SHA=e2edda75bfb089654705cf65a13b58933bfd5f57148e8ebda916f58a2474f1f7"
set "NODE_FILE=node-v26.13.1-win-x64.zip"
set "NODE_DIR=node-v26.13.1-win-x64"

set "UV_URL=https://github.com/astral-sh/uv/releases/download/0.13.8/uv-x86_64-pc-windows-msvc.zip"
set "UV_SHA=529e78a9cec6cd7e3e014f7ecd8bda0c113969d4ed0f2efeedb85c30943325b8"
set "UV_FILE=uv-x86_64-pc-windows-msvc.zip"

rem ===========================================================================
echo === [1/4] VS Code ===
call :get "!VSC_URL!" "!VSC_SHA!" "!VSC_FILE!" || exit /b 1
if not exist "%TOOLS%\vscode\Code.exe" (
  if not exist "%TOOLS%\vscode\" mkdir "%TOOLS%\vscode"
  call :run tar -xf "%DL%\!VSC_FILE!" -C "%TOOLS%\vscode" || exit /b 1
)
rem A "data" folder switches the ZIP build to portable mode (settings stay in kc-tools).
if not exist "%TOOLS%\vscode\data\" mkdir "%TOOLS%\vscode\data"
call :addpath "%TOOLS%\vscode\bin"

echo === [2/4] Git ===
call :get "!GIT_URL!" "!GIT_SHA!" "!GIT_FILE!" || exit /b 1
if not exist "%TOOLS%\git\cmd\git.exe" (
  if not exist "%TOOLS%\git\" mkdir "%TOOLS%\git"
  rem PortableGit is a self-extracting 7-Zip file. tar.exe may be able to read it. [test this first]
  call :run tar -xf "%DL%\!GIT_FILE!" -C "%TOOLS%\git"
  if not exist "%TOOLS%\git\cmd\git.exe" (
    echo tar could not unpack it. Do it by hand, it is not an installer:
    echo   1. Double-click  %DL%\!GIT_FILE!
    echo   2. In the box, set the folder to  %TOOLS%\git   and press OK.
    echo   3. Run setup-tools again.
    echo If Windows asks for an administrator password: STOP and ask Corey.
    exit /b 1
  )
)
call :addpath "%TOOLS%\git\cmd"

echo === [3/4] Node.js ===
call :get "!NODE_URL!" "!NODE_SHA!" "!NODE_FILE!" || exit /b 1
if not exist "%TOOLS%\!NODE_DIR!\node.exe" (
  call :run tar -xf "%DL%\!NODE_FILE!" -C "%TOOLS%" || exit /b 1
)
call :addpath "%TOOLS%\!NODE_DIR!"

echo === [4/4] Your own tools folder for loop.cmd, start-helper.cmd and aider ===
if not exist "%USERPROFILE%\.local\bin\" mkdir "%USERPROFILE%\.local\bin"
call :addpath "%USERPROFILE%\.local\bin"

if /i "%~1"=="with-aider" (
  echo === [+] uv, for the Aider helper ===
  call :get "!UV_URL!" "!UV_SHA!" "!UV_FILE!" || exit /b 1
  if not exist "%TOOLS%\uv\" mkdir "%TOOLS%\uv"
  call :run tar -xf "%DL%\!UV_FILE!" -C "%TOOLS%\uv" || exit /b 1
  call :addpath "%TOOLS%\uv"
  echo Next, in a NEW window:  uv tool install --python 3.12 --exclude-newer 2026-02-13 aider-chat==0.86.2
)

echo.
echo DONE. Close this window and open a NEW one, then check:
echo   git --version     node --version     npm --version     code --version
echo No indicators of a problem found by these checks: every file matched its pinned sha256.
echo That cannot prove the tools are harmless; it proves they are the files the vendors published.
exit /b 0

rem ===========================================================================
rem  Helpers
rem ===========================================================================

:get
rem :get url sha256 filename  - download once, then check the hash before anything uses it.
set "URL=%~1" & set "SHA=%~2" & set "F=%DL%\%~3"
if not "!URL:UNPINNED=!"=="!URL!" (echo STOP: %~3 is UNPINNED in PINS.md. Ask Corey. & exit /b 1)
if not "!SHA:UNPINNED=!"=="!SHA!" (echo STOP: %~3 is UNPINNED in PINS.md. Ask Corey. & exit /b 1)
if exist "!F!" call :hashok "!F!" "!SHA!" && (echo Already have %~3, hash OK. & exit /b 0)
if exist "!F!" del "!F!"
call :run curl.exe -fL --proto "=https" --tlsv1.2 -o "!F!.part" "!URL!" || (echo STOP: download failed. & exit /b 1)
call :hashok "!F!.part" "!SHA!" || (
  echo STOP: the sha256 of %~3 does not match PINS.md. Deleted it. Do not work around this: tell Corey.
  del "!F!.part"
  exit /b 1
)
move /y "!F!.part" "!F!" >nul
echo Hash OK: %~3
exit /b 0

:hashok
rem :hashok file expected-sha256   - certutil prints the hash on its second line.
set "GOT="
echo ^> certutil -hashfile "%~1" SHA256
for /f "skip=1 delims=" %%h in ('certutil -hashfile "%~1" SHA256') do if not defined GOT set "GOT=%%h"
set "GOT=!GOT: =!"
if /i "!GOT!"=="%~2" exit /b 0
exit /b 1

:addpath
rem :addpath folder  - append to the USER Path (HKCU\Environment) only if it is not there yet.
rem Not "setx PATH": that copies the system Path into your user Path and cuts it at 1024 characters.
set "KC_ADD=%~1"
echo ^> add to your user Path: %~1
powershell -NoProfile -NonInteractive -Command "$d=$env:KC_ADD; $p=[Environment]::GetEnvironmentVariable('Path','User'); if(-not $p){$p=''}; if(($p -split ';') -contains $d){'  already on your Path'} else {[Environment]::SetEnvironmentVariable('Path',($p.TrimEnd(';')+';'+$d).TrimStart(';'),'User'); '  added'}"
exit /b 0

:run
echo ^> %*
call %*
exit /b %ERRORLEVEL%

@echo off
rem start-helper.cmd - Corey's launcher for Aider. Copy to %USERPROFILE%\.local\bin\
rem Use it from the game folder:   start-helper https://some-random-words.trycloudflare.com
rem
rem Why a launcher: Aider also reads settings from files inside a repo (.aider.conf.yml,
rem .aider.model.*.yml/json, .env). Those could point the key at someone else's server or set
rem commands to run. This launcher (1) refuses to start if such a file is in the folder,
rem (2) passes Corey's own files explicitly, and (3) repeats every safety switch on the
rem command line, which wins over files and environment. Not tested yet [test this first].
setlocal EnableDelayedExpansion
set "URL=%~1"
set "H=%USERPROFILE%"

if "!URL!"=="" goto usage
echo(!URL!| findstr /r /x /c:"https://[abcdefghijklmnopqrstuvwxyz0123456789-]*\.trycloudflare\.com" >nul || goto usage

if not exist ".git\" (
  echo STOP: start me from the game folder, the one that has a .git folder in it.
  exit /b 2
)
for %%F in (.env .aider.conf.yml .aider.model.settings.yml .aider.model.metadata.json) do (
  if exist "%%F" (
    echo STOP: the file %%F is in this folder. Do not start the helper. Ask Corey.
    exit /b 3
  )
)
if not defined AIDER_OPENAI_API_KEY (
  echo STOP: the key is not set on this Windows account. Ask Corey, GUIDE-WINDOWS step 11.
  exit /b 2
)
if not exist "%H%\.aider-history\" mkdir "%H%\.aider-history"

aider --config "%H%\.aider.conf.yml" ^
  --env-file "%H%\.aider-empty.txt" --load "%H%\.aider-empty.txt" ^
  --model-settings-file "%H%\.aider.model.settings.yml" ^
  --model-metadata-file "%H%\.aider.model.metadata.json" ^
  --aiderignore "%H%\.aiderignore-signal" ^
  --read "%H%\.aider-conventions.md" ^
  --chat-history-file "%H%\.aider-history\chat.md" ^
  --input-history-file "%H%\.aider-history\input.txt" ^
  --openai-api-base "!URL!/v1" ^
  --model openai/kaggle-coder --weak-model openai/kaggle-coder --editor-model openai/kaggle-coder ^
  --architect --no-auto-accept-architect --no-stream ^
  --no-auto-lint --no-auto-test --no-suggest-shell-commands --no-notifications ^
  --no-watch-files --no-detect-urls --no-check-update --analytics-disable --disable-playwright
exit /b %ERRORLEVEL%

:usage
echo Usage: start-helper https://some-random-words.trycloudflare.com
echo Copy the address exactly as your own Kaggle notebook printed it.
exit /b 2

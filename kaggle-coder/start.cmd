@echo off
title AI helper
if not exist "%USERPROFILE%\.kaggle-coder\setup-done.txt" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0src\setup.ps1"
if not exist "%USERPROFILE%\.kaggle-coder\setup-done.txt" goto end
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0src\start.ps1" %*
:end
pause

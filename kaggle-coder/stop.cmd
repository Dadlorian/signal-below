@echo off
title Stop AI helper
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0src\start.ps1" -Stop
pause

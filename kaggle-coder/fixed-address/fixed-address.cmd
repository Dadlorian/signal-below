@echo off
title Permanent address (optional)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\src\start.ps1" -SetFixed
pause

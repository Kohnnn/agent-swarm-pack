@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Paperclip

:: ============================================================
::  Paperclip Daily Launcher
:: ============================================================

cd /d "%~dp0paperclip"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter paperclip directory.
    echo         Run setup_paperclip.bat first.
    pause
    exit /b 1
)

set "PAPERCLIP_PORT=3100"
call :is_port_in_use !PAPERCLIP_PORT!
if !ERRORLEVEL! equ 0 (
    echo [WARN] Port !PAPERCLIP_PORT! might already be in use.
    echo        If Paperclip is already running, open http://localhost:!PAPERCLIP_PORT!
    echo        Otherwise, stop the existing process.
)

echo.
echo ========================================================
echo    Paperclip  -  Starting dev server
echo    UI will be at: http://localhost:!PAPERCLIP_PORT!
echo ========================================================
echo.

call npx pnpm dev

pause
goto :eof

:is_port_in_use
set "_PORT_TO_CHECK=%~1"
for /f "tokens=1" %%x in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":%_PORT_TO_CHECK% "') do (
    exit /b 0
)
exit /b 1

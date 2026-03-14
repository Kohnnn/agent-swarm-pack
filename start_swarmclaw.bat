@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title SwarmClaw

:: ============================================================
::  SwarmClaw Daily Launcher
:: ============================================================

cd /d "%~dp0swarmclaw"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter swarmclaw directory.
    echo         Run setup_swarmclaw.bat first.
    pause
    exit /b 1
)

set "ACTIVE_PORT="
for %%p in (3456 3460 3470) do (
    call :is_port_in_use %%p
    if !ERRORLEVEL! equ 0 if not defined ACTIVE_PORT set "ACTIVE_PORT=%%p"
)

if exist ".next\dev\lock" (
    if defined ACTIVE_PORT (
        echo [INFO] Existing SwarmClaw dev server appears to be running.
        echo        Open: http://127.0.0.1:!ACTIVE_PORT!
        echo        Stop the old server first if you want to restart on a different port.
        pause
        exit /b 0
    )

    echo [WARN] Found stale Next.js lock file. Removing it...
    del /f /q ".next\dev\lock" >nul 2>&1
)

set "SWARMCLAW_PORT=3456"
call :is_port_in_use !SWARMCLAW_PORT!
if !ERRORLEVEL! equ 0 (
    echo [WARN] Port 3456 is already in use. Trying fallback ports...
    set "SWARMCLAW_PORT=3460"
    call :is_port_in_use !SWARMCLAW_PORT!
    if !ERRORLEVEL! equ 0 (
        set "SWARMCLAW_PORT=3470"
        call :is_port_in_use !SWARMCLAW_PORT!
        if !ERRORLEVEL! equ 0 (
            echo [ERROR] Ports 3456, 3460, and 3470 are all in use.
            echo         Stop existing process or run manually with a free port.
            pause
            exit /b 1
        )
    )
)

echo.
echo ========================================================
echo    SwarmClaw  -  Starting dev server
echo    UI will be at: http://127.0.0.1:!SWARMCLAW_PORT!
echo ========================================================
echo.

if !SWARMCLAW_PORT! equ 3456 (
    call npm run dev
) else (
    call node .\node_modules\next\dist\bin\next dev --webpack --hostname 0.0.0.0 -p !SWARMCLAW_PORT!
)

goto :eof

:is_port_in_use
set "_PORT_TO_CHECK=%~1"
for /f "tokens=1" %%x in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":%_PORT_TO_CHECK% "') do (
    exit /b 0
)
exit /b 1

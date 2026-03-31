@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title SwarmClaw

:: ============================================================
::  SwarmClaw Premium Launcher
::  Target OS  : Windows 10/11
:: ============================================================

set "RUN_DEV=0"
set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "RUN_DOCTOR=0"
set "PORT=3456"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--dev" set "RUN_DEV=1"
if /i "%~1"=="--update" set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--doctor" set "RUN_DOCTOR=1"
shift
goto parse_args

:args_done
set "NEEDS_SETUP=0"
if not exist "%~dp0swarmclaw" set "NEEDS_SETUP=1"
if not exist "%~dp0swarmclaw\.env" set "NEEDS_SETUP=1"
if not exist "%~dp0swarmclaw\node_modules" set "NEEDS_SETUP=1"

if "%NEEDS_SETUP%"=="1" (
    echo [INFO] Bootstrap required. Running setup_swarmclaw.bat...
    call "%~dp0setup_swarmclaw.bat"
    if !ERRORLEVEL! neq 0 exit /b 1
)

cd /d "%~dp0swarmclaw"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter swarmclaw directory.
    exit /b 1
)

:: Handle explicit update
if "%DO_UPDATE%"=="1" (
    echo [INFO] Updating SwarmClaw...
    call "%~dp0setup_swarmclaw.bat" --update
    if !ERRORLEVEL! neq 0 exit /b 1
)

:: Port Management
echo [INFO] Checking port !PORT!...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":!PORT! "') do (
    set "PORT_PID=%%p"
)

if defined PORT_PID (
    echo [INFO] Stopping existing SwarmClaw process on port !PORT! (pid=!PORT_PID!)...
    taskkill /PID !PORT_PID! /F >nul 2>&1
    timeout /t 1 >nul
)

echo.
echo ================================================
echo   SwarmClaw starting
echo   Dashboard: http://127.0.0.1:!PORT!
echo ================================================
echo.

if "%RUN_DEV%"=="1" (
    call npm run dev
) else (
    call npm start
)

endlocal
exit /b 0

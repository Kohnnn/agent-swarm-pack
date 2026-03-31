@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title SwarmClaw Setup

:: ============================================================
::  SwarmClaw 1-Click Setup for AI Agent Orchestration
::  Target OS  : Windows 10/11
::  Repository : https://github.com/swarmclawai/swarmclaw.git
:: ============================================================

set "DO_UPDATE=0"
set "SKIP_TESTS=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--update" set "DO_UPDATE=1"
if /i "%~1"=="--skip-tests" set "SKIP_TESTS=1"
shift
goto parse_args

:args_done
echo.
echo ========================================================
echo    SwarmClaw  -  1-Click Setup Script
echo    AI Agent Orchestration Dashboard
echo ========================================================
echo.

:: ============================================================
:: 1. PREREQUISITE CHECKS
21: :: ============================================================
echo [1/5] Checking prerequisites...
echo.

:: -- Check Node.js --
where node >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Please install Node.js v22+ from https://nodejs.org/
    goto :fail
)

:: Capture Node version and verify v22+
for /f "tokens=1 delims=." %%v in ('node -v 2^>nul') do set "NODE_VER_RAW=%%v"
set "NODE_VER=!NODE_VER_RAW:v=!"
if !NODE_VER! LSS 22 (
    echo [ERROR] Node.js v22+ is required. Detected: v!NODE_VER!.
    echo         Please upgrade from https://nodejs.org/
    goto :fail
)
echo   [OK] Node.js v!NODE_VER! detected

:: -- Check Git --
where git >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo         Please install Git from https://git-scm.com/
    goto :fail
)
for /f "tokens=3" %%g in ('git --version 2^>nul') do set "GIT_VER=%%g"
echo   [OK] Git !GIT_VER! detected
echo.

:: ============================================================
:: 2. CLONE & INSTALL
:: ============================================================
echo [2/5] Cloning and installing SwarmClaw...
echo.

if exist "swarmclaw" (
    echo   [INFO] Directory "swarmclaw" already exists.
    set "SWARMCLAW_EXISTS=1"
) else (
    echo   Cloning repository https://github.com/swarmclawai/swarmclaw.git ...
    git clone https://github.com/swarmclawai/swarmclaw.git
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] git clone failed. Check your network and the URL.
        goto :fail
    )
    echo   [OK] Repository cloned
    set "SWARMCLAW_EXISTS=0"
)

pushd swarmclaw
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter swarmclaw directory.
    goto :fail
)

:: Always try to pull the latest changes
echo   [UPDATE] Pulling latest changes from remote...
git pull
if !ERRORLEVEL! neq 0 (
    echo   [WARN] Could not pull latest changes. Continuing with existing files.
) else (
    echo   [OK] Repository up to date
)

:: Install dependencies
echo.
echo   Installing dependencies...
call npm install
if !ERRORLEVEL! neq 0 (
    echo [ERROR] npm install failed. Attempting fallback easy setup...
    call npm run setup:easy
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Fallback setup also failed.
        popd
        goto :fail
    )
)
echo   [OK] Dependencies installed
echo.

:: ============================================================
:: 3. ENVIRONMENT CONFIGURATION
:: ============================================================
echo [3/5] Configuring environment variables...
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo   [OK] Created .env from .env.example
    ) else (
        echo   [WARN] .env.example not found. Creating minimal .env...
        (
            echo PORT=3456
            echo NODE_ENV=development
        ) > .env
        echo   [OK] Created minimal .env
    )
) else (
    echo   [OK] .env already exists
)
echo.

:: ============================================================
:: 4. VERIFICATION
:: ============================================================
echo [4/5] Running verification...
echo.

if "%SKIP_TESTS%"=="1" (
    echo   [INFO] Skipping tests.
) else (
    call npm run check >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo   [WARN] Health check returned warnings.
    ) else (
        echo   [OK] Basic checks passed
    )
)
echo.

:: ============================================================
:: 5. FINALIZATION
:: ============================================================
echo [5/5] Finalizing...
echo.

echo ========================================================
echo    Setup complete!
echo ========================================================
echo.
echo   To launch SwarmClaw:
echo     Double-click start_swarmclaw.bat (in the root folder)
echo.
echo   Then open: http://127.0.0.1:3456 in your browser
echo.

popd
goto :end

:fail
echo.
echo ========================================================
echo    Setup failed. Please fix the errors above.
echo ========================================================
echo.

:end
endlocal
pause

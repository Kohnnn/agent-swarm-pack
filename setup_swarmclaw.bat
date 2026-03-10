@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title SwarmClaw Setup

:: ============================================================
::  SwarmClaw 1-Click Setup for OpenClaw Agent Swarm
::  Target OS  : Windows 10/11
::  Repository : https://github.com/swarmclawai/swarmclaw
:: ============================================================

echo.
echo ========================================================
echo    SwarmClaw  -  1-Click Setup Script (Fixed)
echo    OpenClaw Agent Swarm Control Plane
echo ========================================================
echo.

echo [1/4] Checking prerequisites...
echo.

where node >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Please install Node.js v22.6+ from https://nodejs.org/
    goto :fail
)

for /f "tokens=1,2 delims=." %%a in ('node -v 2^>nul') do (
    set "NODE_VER_MAJOR_RAW=%%a"
    set "NODE_VER_MINOR=%%b"
)
set "NODE_VER_MAJOR=!NODE_VER_MAJOR_RAW:v=!"
if !NODE_VER_MAJOR! LSS 22 (
    echo [ERROR] Node.js v22.6+ is required. Detected: v!NODE_VER_MAJOR!.
    goto :fail
)
if !NODE_VER_MAJOR! EQU 22 if !NODE_VER_MINOR! LSS 6 (
    echo [ERROR] Node.js v22.6+ is required. Detected: v!NODE_VER_MAJOR!.!NODE_VER_MINOR!.
    goto :fail
)
echo   [OK] Node.js v!NODE_VER_MAJOR!.!NODE_VER_MINOR! detected
if !NODE_VER_MAJOR! EQU 22 if !NODE_VER_MINOR! LSS 13 (
    echo   [WARN] Node v22.13+ is recommended to reduce engine warnings from some dependencies.
)

where git >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo         Please install Git from https://git-scm.com/
    goto :fail
)
for /f "tokens=3" %%g in ('git --version 2^>nul') do set "GIT_VER=%%g"
echo   [OK] Git !GIT_VER! detected

where npm >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo         Please install Node.js + npm from https://nodejs.org/
    goto :fail
)
echo   [OK] npm detected
echo.

echo [2/4] Cloning and installing swarmclaw...
echo.

if exist "swarmclaw" (
    echo   [INFO] Directory "swarmclaw" already exists.
    set "SWARMCLAW_EXISTS=1"
) else (
    echo   Cloning repository https://github.com/swarmclawai/swarmclaw ...
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

if "!SWARMCLAW_EXISTS!"=="1" (
    echo   [UPDATE] Checking for updates from remote repository...
    git pull
    if !ERRORLEVEL! neq 0 (
        echo   [WARN] Could not pull latest changes. Continuing with existing files.
    ) else (
        echo   [OK] Repository updated
    )
)

echo   Installing dependencies...
call npm install
if !ERRORLEVEL! neq 0 (
    echo [ERROR] npm install failed. Please check the logs above.
    popd
    goto :fail
)
echo   [OK] Dependencies installed

where deno >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo   [WARN] Deno is not installed. Sandbox tools will be unavailable until Deno is installed.
    echo          Install from: https://deno.land/#installation
) else (
    echo   [OK] Deno detected
)

echo   Bootstrapping local runtime files...
call npm run setup:easy -- --skip-install
if !ERRORLEVEL! neq 0 (
    echo   [WARN] setup:easy failed. Applying Windows fallback bootstrap...
    echo          This bypasses an upstream npm detection issue in easy-setup on some Windows hosts.

    if not exist "data" mkdir "data"
    if not exist "data" (
        echo [ERROR] Could not create data directory.
        popd
        goto :fail
    )

    if not exist ".env.local" (
        (
            echo # SwarmClaw local environment variables
            echo # ACCESS_KEY and CREDENTIAL_SECRET are auto-generated on first app run.
        ) > ".env.local"
    )

    if not exist ".env.local" (
        echo [ERROR] Could not create .env.local.
        popd
        goto :fail
    )

    echo   [OK] Fallback bootstrap completed
) else (
    echo   [OK] Local runtime prepared
)
echo.

echo [3/4] Validating local config...
echo.

if exist ".env.local" (
    echo   [OK] .env.local found
) else (
    echo   [WARN] .env.local not found yet. It will be generated on first run.
)

if exist "data" (
    echo   [OK] data directory found
) else (
    echo   [WARN] data directory not found yet. It will be created on first run.
)
echo.

echo [4/4] Finalizing...
echo.
echo ========================================================
echo    Setup complete!
echo ========================================================
echo.
echo   OPTION 1 - Use the launcher (recommended):
echo     .\start_swarmclaw.bat
echo.
echo   OPTION 2 - Manual start from swarmclaw directory:
echo     npm run dev
echo.
echo   Then open:  http://127.0.0.1:3456  in your browser
echo.
echo   First run prints ACCESS KEY in terminal.
echo   Save it in your password manager before closing terminal.
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

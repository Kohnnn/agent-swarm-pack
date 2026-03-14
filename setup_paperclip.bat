@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Paperclip Setup

:: ============================================================
::  Paperclip 1-Click Setup for OpenClaw Agent Swarm
::  Target OS  : Windows 10/11
::  Repository : https://github.com/paperclipai/paperclip
:: ============================================================

echo.
echo ========================================================
echo    Paperclip  -  1-Click Setup Script
echo    Orchestration for Zero-Human Companies
echo ========================================================
echo.

echo [1/4] Checking prerequisites...
echo.

where node >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Please install Node.js v20+ from https://nodejs.org/
    goto :fail
)

for /f "tokens=1,2 delims=." %%a in ('node -v 2^>nul') do (
    set "NODE_VER_MAJOR_RAW=%%a"
    set "NODE_VER_MINOR=%%b"
)
set "NODE_VER_MAJOR=!NODE_VER_MAJOR_RAW:v=!"
if !NODE_VER_MAJOR! LSS 20 (
    echo [ERROR] Node.js v20+ is required. Detected: v!NODE_VER_MAJOR!.
    goto :fail
)
echo   [OK] Node.js v!NODE_VER_MAJOR!.!NODE_VER_MINOR! detected

where git >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo         Please install Git from https://git-scm.com/
    goto :fail
)
for /f "tokens=3" %%g in ('git --version 2^>nul') do set "GIT_VER=%%g"
echo   [OK] Git !GIT_VER! detected

where npx >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] npx is not installed or not in PATH.
    echo         Please install Node.js + npm from https://nodejs.org/
    goto :fail
)
echo   [OK] npx detected
echo.

echo [2/4] Cloning and installing paperclip...
echo.

if exist "paperclip" (
    echo   [INFO] Directory "paperclip" already exists.
    set "PAPERCLIP_EXISTS=1"
) else (
    echo   Cloning repository https://github.com/paperclipai/paperclip ...
    git clone https://github.com/paperclipai/paperclip.git
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] git clone failed. Check your network and the URL.
        goto :fail
    )
    echo   [OK] Repository cloned
    set "PAPERCLIP_EXISTS=0"
)

pushd paperclip
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter paperclip directory.
    goto :fail
)

if "!PAPERCLIP_EXISTS!"=="1" (
    echo   [UPDATE] Checking for updates from remote repository...
    git pull
    if !ERRORLEVEL! neq 0 (
        echo   [WARN] Could not pull latest changes. Continuing with existing files.
    ) else (
        echo   [OK] Repository updated
    )
)

echo   Installing dependencies with pnpm...
call npx pnpm install
if !ERRORLEVEL! neq 0 (
    echo [ERROR] pnpm install failed. Please check the logs above.
    popd
    goto :fail
)
echo   [OK] Dependencies installed

echo   [OK] Local runtime prepared
echo.

echo [3/4] Validating setup...
echo.

if exist "package.json" (
    echo   [OK] Paperclip directory initialized successfully.
) else (
    echo   [WARN] Could not verify installation files.
)
echo.

echo [4/4] Finalizing...
echo.
echo ========================================================
echo    Setup complete!
echo ========================================================
echo.
echo   OPTION 1 - Use the launcher (recommended):
echo     .\start_paperclip.bat
echo.
echo   OPTION 2 - Manual start from paperclip directory:
echo     npx pnpm dev
echo.
echo   Paperclip UI will be available at: http://localhost:3100
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

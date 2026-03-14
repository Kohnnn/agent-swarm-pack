@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title GoClaw Setup

:: ============================================================
::  GoClaw 1-Click Setup
::  Target OS  : Windows 10/11
::  Repository : https://github.com/nextlevelbuilder/goclaw
:: ============================================================

echo.
echo ========================================================
echo    GoClaw  -  1-Click Setup Script
echo    Multi-Agent AI Gateway
echo ========================================================
echo.

echo [1/3] Checking prerequisites...
echo.

where git >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    goto :fail
)

where go >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Go is not installed or not in PATH.
    echo         Please install Go 1.25+ from https://go.dev/
    goto :fail
)

where docker >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [WARN] Docker is not installed or not in PATH.
    echo        Docker is recommended for PostgreSQL and Redis services.
)

echo [2/3] Cloning and installing goclaw...
echo.

if exist "goclaw" (
    echo   [INFO] Directory "goclaw" already exists.
    set "GOCLAW_EXISTS=1"
) else (
    echo   Cloning repository https://github.com/nextlevelbuilder/goclaw ...
    git clone https://github.com/nextlevelbuilder/goclaw.git
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] git clone failed. Check your network and the URL.
        goto :fail
    )
    echo   [OK] Repository cloned
    set "GOCLAW_EXISTS=0"
)

pushd goclaw

if "!GOCLAW_EXISTS!"=="1" (
    echo   [UPDATE] Checking for updates from remote repository...
    git pull
)

echo   Downloading Go modules...
go mod download
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Failed to download Go modules.
    popd
    goto :fail
)

echo   Setting up environment variables...
if not exist ".env" (
    where bash >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        bash prepare-env.sh
    ) else (
        echo [WARN] prepare-env.sh failed or bash not available. Falling back to copy .env.example
        copy .env.example .env >nul
    )
)

echo [3/3] Finalizing...
echo.
echo ========================================================
echo    Setup complete!
echo ========================================================
echo.
echo   To start GoClaw locally, run:
echo     .\start_goclaw.bat
echo.
echo   Note: GoClaw requires PostgreSQL. If using Docker, you can run the full stack:
echo     cd goclaw
echo     docker compose -f docker-compose.yml -f docker-compose.postgres.yml -f docker-compose.selfservice.yml up -d --build
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

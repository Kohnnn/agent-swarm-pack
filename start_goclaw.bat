@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title GoClaw Launcher

:: ============================================================
::  GoClaw Daily Launcher
:: ============================================================

cd /d "%~dp0goclaw"
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Could not enter goclaw directory.
    echo         Run setup_goclaw.bat first.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    GoClaw  -  Starting GoClaw Gateway
echo ========================================================
echo.

:: Build the binary
echo [INFO] Building GoClaw...
go build -ldflags="-s -w" -o goclaw.exe .
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo [INFO] Build successful. 

:: Check if PostgreSQL is available (Assuming default configuration)
echo [INFO] Make sure you have PostgreSQL running, or use Docker Compose.
echo [INFO] Starting GoClaw...
echo.

.\goclaw.exe

pause

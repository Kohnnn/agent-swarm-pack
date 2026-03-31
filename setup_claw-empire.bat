@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

set "PROJECT_DIR=claw-empire"
set "REQUIRED_NODE=22"

echo.
echo   [94m┌────────────────────────────────────────────────────────┐ [0m
echo   [94m│                                                        │ [0m
echo   [94m│          [96mAgentsSwarm: Claw Empire Setup [0m               [94m│ [0m
echo   [94m│                                                        │ [0m
echo   [94m└────────────────────────────────────────────────────────┘ [0m
echo.

:: [1/5] Prerequisite Check: Node
echo  [90m[1/5] [0m Checking Node.js version...
for /f "tokens=v1" %%v in ('node -v 2^>nul') do (
    set "NODE_VER=%%v"
    set "NODE_VER=!NODE_VER:v=!"
    for /f "tokens=1 delims=." %%m in ("!NODE_VER!") do set "NODE_MAJOR=%%m"
)
if "!NODE_MAJOR!" == "" (
    echo  [91m[ERROR] Node.js is not installed. Please install Node.js !REQUIRED_NODE! or higher. [0m
    exit /b 1
)
if !NODE_MAJOR! LSS !REQUIRED_NODE! (
    echo  [91m[ERROR] Node.js version !NODE_VER! is too old. Please upgrade to Node.js !REQUIRED_NODE!+. [0m
    exit /b 1
)
echo  [32m[OK] [0m Found Node.js !NODE_VER!

:: [2/5] Prerequisite Check: pnpm
echo  [90m[2/5] [0m Checking pnpm availability...
:: Use pnpm.exe directly if available to bypass corepack issues
where pnpm.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PNPM_CMD=pnpm.exe"
) else (
    set "PNPM_CMD=pnpm"
)
!PNPM_CMD! -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [91m[ERROR] pnpm not found. Please install pnpm (npm install -g pnpm). [0m
    exit /b 1
)
echo  [32m[OK] [0m Found !PNPM_CMD!.

:: [3/5] Submodule Check
echo  [90m[3/5] [0m Initializing submodules...
pushd %PROJECT_DIR%
git submodule update --init --recursive
if %ERRORLEVEL% neq 0 (
    echo  [93m[WARN] Submodule update failed or not a git repo. [0m
) else (
    echo  [32m[OK] [0m Submodules ready.
)
popd

:: [4/5] Environment Bootstrapping
echo  [90m[4/5] [0m Bootstrapping environment...
if not exist "%PROJECT_DIR%\.env" (
    if exist "%PROJECT_DIR%\.env.example" (
        copy "%PROJECT_DIR%\.env.example" "%PROJECT_DIR%\.env" >nul
        echo  [32m[OK] [0m Created .env from .env.example
    ) else (
        echo  [93m[WARN] .env.example not found in %PROJECT_DIR%. [0m
    )
) else (
    echo  [32m[OK] [0m .env already exists.
)

:: [5/5] Dependencies
echo  [90m[5/5] [0m Installing dependencies...
pushd %PROJECT_DIR%
call !PNPM_CMD! install
if %ERRORLEVEL% neq 0 (
    echo  [91m[ERROR] Dependency installation failed. [0m
    popd
    exit /b 1
)
popd
echo  [32m[OK] [0m Dependencies installed.

:: Finalization
echo.
echo  [32m[SUCCESS] [0m Claw Empire setup complete!
echo Run  [96mstart_claw-empire.bat [0m to launch the Discord swarm.
echo.
pause

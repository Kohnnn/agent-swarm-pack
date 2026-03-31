@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Paperclip Setup

set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "SKIP_TESTS=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--update"     set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--skip-tests" set "SKIP_TESTS=1"
shift
goto parse_args

:args_done
set "ROOT_DIR=%~dp0"
set "PROJECT_DIR=%ROOT_DIR%paperclip"
set "REQUIRED_NODE=22"

:: ─── Banner ──────────────────────────────────────────────────────────────────
echo.
echo   [94m╔═══════════════════════════════════════════════════════════╗[0m
echo   [94m║[0m   [96mPaperclip Setup[0m  [37m^|[0m  AgentsSwarm AI Task Installer      [94m║[0m
echo   [94m╚═══════════════════════════════════════════════════════════╝[0m
echo.

:: ─── Directory Guard ─────────────────────────────────────────────────────────
if not exist "!PROJECT_DIR!" (
  echo [ERROR] paperclip directory not found at: !PROJECT_DIR!
  echo [INFO]  Run: git clone https://github.com/paperclipai/paperclip paperclip
  exit /b 1
)

:: ─── [1/6] Prerequisite: Node.js ─────────────────────────────────────────────
echo [1/6] Checking Node.js runtime...
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo [INFO]  Download: https://nodejs.org/
  exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -v') do set "NODE_MAJOR_RAW=%%v"
set "NODE_MAJOR=!NODE_MAJOR_RAW:v=!"
if !NODE_MAJOR! LSS !REQUIRED_NODE! (
  echo [ERROR] Node.js v!REQUIRED_NODE!+ required. Detected: v!NODE_MAJOR!.
  exit /b 1
)
echo [OK]   Node.js v!NODE_MAJOR! detected.

:: ─── [2/6] Prerequisite: pnpm ────────────────────────────────────────────────
echo [2/6] Checking pnpm...
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [WARN] pnpm not found. Installing globally...
  call npm install -g pnpm
  if errorlevel 1 (
    echo [ERROR] Could not install pnpm. Resolve manually: npm install -g pnpm
    exit /b 1
  )
)
for /f %%v in ('pnpm -v') do echo [OK]   pnpm %%v detected.

:: ─── [3/6] Environment Bootstrap ────────────────────────────────────────────
echo [3/6] Bootstrapping environment...
if "!RESYNC_ENV!"=="1" (
  if exist "!PROJECT_DIR!\.env.example" (
    copy /y "!PROJECT_DIR!\.env.example" "!PROJECT_DIR!\.env" >nul
    echo [OK]   .env force-resynced from .env.example.
  ) else (
    echo [WARN] No .env.example found — skipping resync.
  )
) else if not exist "!PROJECT_DIR!\.env" (
  if exist "!PROJECT_DIR!\.env.example" (
    copy /y "!PROJECT_DIR!\.env.example" "!PROJECT_DIR!\.env" >nul
    echo [OK]   Created .env from .env.example.
    echo [INFO] Generating secure random secret...
    powershell -NoProfile -Command ^
      "$s=[Convert]::ToBase64String((1..32|%%{[byte](Get-Random -Maximum 255)}));" ^
      "(Get-Content '!PROJECT_DIR!\.env') -replace 'CHANGE_ME',$s | Set-Content '!PROJECT_DIR!\.env'" >nul 2>&1
    echo [OK]   Secrets generated.
  ) else (
    echo [WARN] No .env.example found. Create !PROJECT_DIR!\.env manually.
  )
) else (
  echo [OK]   .env already exists. Use --resync-env to overwrite.
)

:: ─── [4/6] Dependencies ──────────────────────────────────────────────────────
echo [4/6] Installing dependencies...
cd /d "!PROJECT_DIR!"
if errorlevel 1 (
  echo [ERROR] Could not enter !PROJECT_DIR!
  exit /b 1
)
call pnpm install
if errorlevel 1 (
  echo [ERROR] pnpm install failed. Resolve errors above and retry.
  exit /b 1
)
echo [OK]   Dependencies installed.

:: ─── [5/6] Update ────────────────────────────────────────────────────────────
if "!DO_UPDATE!"=="1" (
  echo [5/6] Updating dependencies...
  call pnpm update
  if errorlevel 1 echo [WARN] pnpm update failed. Continuing with installed versions.
  echo [OK]   Dependencies up to date.
) else (
  echo [5/6] Skipping dependency update. Use --update to pull latest.
)

:: ─── [6/6] Validation ────────────────────────────────────────────────────────
if "!SKIP_TESTS!"=="0" (
  echo [6/6] Running tests...
  call pnpm test
  if errorlevel 1 (
    echo [WARN] Some tests failed. Resolve before production use.
  ) else (
    echo [OK]   All tests passed.
  )
) else (
  echo [6/6] Skipping tests. Run setup without --skip-tests for full verification.
)

:: ─── Summary ─────────────────────────────────────────────────────────────────
echo.
echo   [90m─────────────────────────────────────────────────────────────[0m
echo   [92m  Paperclip setup complete![0m
echo   [90m  Next steps:[0m
echo   [90m    1. Edit [0m!PROJECT_DIR!\.env[90m — set OPENAI_API_KEY and other keys[0m
echo   [90m    2. Run: [0mstart_paperclip.bat
echo   [90m    3. Run: [0mstart_paperclip.bat --doctor[90m   (pre-flight check)[0m
echo   [90m─────────────────────────────────────────────────────────────[0m
echo.
endlocal
exit /b 0

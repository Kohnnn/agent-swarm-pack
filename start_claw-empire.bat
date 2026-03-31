@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Claw Empire

set "RUN_DEV=0"
set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "RUN_DOCTOR=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--dev"        set "RUN_DEV=1"
if /i "%~1"=="--update"     set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--doctor"     set "RUN_DOCTOR=1"
shift
goto parse_args

:args_done
set "ROOT_DIR=%~dp0"
set "PROJECT_DIR=%ROOT_DIR%claw-empire"
set "APP_PORT=3200"

:: ─── Banner ──────────────────────────────────────────────────────────────────
echo.
echo   [94m╔═══════════════════════════════════════════════════════════╗[0m
echo   [94m║[0m     [96mClaw Empire[0m  [37m^|[0m  AgentsSwarm Empire Manager           [94m║[0m
echo   [94m╚═══════════════════════════════════════════════════════════╝[0m
echo.

:: ─── Directory Guard ─────────────────────────────────────────────────────────
if not exist "!PROJECT_DIR!" (
  echo [ERROR] claw-empire directory not found at: !PROJECT_DIR!
  echo [INFO]  Clone the repo first or run setup_claw_empire.bat
  exit /b 1
)

:: ─── Auto-Bootstrap ──────────────────────────────────────────────────────────
set "NEEDS_SETUP=0"
if not exist "!PROJECT_DIR!\.env"         set "NEEDS_SETUP=1"
if not exist "!PROJECT_DIR!\node_modules" set "NEEDS_SETUP=1"

if "!NEEDS_SETUP!"=="1" (
  echo [INFO] First-run bootstrap required. Invoking setup_claw_empire.bat...
  set "SETUP_ARGS=--skip-tests"
  if "!DO_UPDATE!"=="1"   set "SETUP_ARGS=!SETUP_ARGS! --update"
  if "!RESYNC_ENV!"=="1"  set "SETUP_ARGS=!SETUP_ARGS! --resync-env"
  call "!ROOT_DIR!setup_claw_empire.bat" !SETUP_ARGS!
  if errorlevel 1 (
    echo [ERROR] Setup failed. Resolve the issues above, then retry.
    exit /b 1
  )
)

:: ─── Env Resync ──────────────────────────────────────────────────────────────
if "!RESYNC_ENV!"=="1" (
  echo [INFO] Re-syncing .env from .env.example...
  if exist "!PROJECT_DIR!\.env.example" (
    copy /y "!PROJECT_DIR!\.env.example" "!PROJECT_DIR!\.env" >nul
    echo [OK]   .env re-synced.
  ) else (
    echo [WARN] No .env.example found — skipping resync.
  )
)

:: ─── Read Config ─────────────────────────────────────────────────────────────
for /f "tokens=1,2 delims==" %%A in ('findstr /b /c:"PORT=" "!PROJECT_DIR!\.env" 2^>nul') do set "APP_PORT=%%B"

:: ─── Optional Update ─────────────────────────────────────────────────────────
if "!DO_UPDATE!"=="1" if "!NEEDS_SETUP!"=="0" (
  echo [INFO] Applying pnpm update before launch...
  pushd "!PROJECT_DIR!"
  call pnpm update
  if errorlevel 1 echo [WARN] pnpm update failed. Continuing with existing versions.
  popd
)

:: ─── Doctor ──────────────────────────────────────────────────────────────────
cd /d "!PROJECT_DIR!"
if errorlevel 1 (
  echo [ERROR] Could not navigate to !PROJECT_DIR!
  exit /b 1
)

if "!RUN_DOCTOR!"=="1" (
  echo [INFO] Doctor mode: checking Node.js + pnpm + SQLite...
  where node >nul 2>&1 || ( echo [ERROR] Node.js not found in PATH. & exit /b 1 )
  echo [OK]   Node.js: found.
  where pnpm >nul 2>&1 || ( echo [WARN] pnpm not found. Install via: npm install -g pnpm )
  echo [INFO] SQLite: using Node.js --experimental-sqlite ^(built-in^).
  if exist "package.json" (
    node -e "const p=require('./package.json');console.log('[OK]   Package:',p.name,'v'+p.version);"
  )
)

:: ─── Port Management ─────────────────────────────────────────────────────────
echo [INFO] Checking port !APP_PORT!...
call :find_port_pid !APP_PORT!
if defined PORT_PID (
  echo [INFO] Stopping existing Claw Empire process on port !APP_PORT! (pid=!PORT_PID!)...
  taskkill /PID !PORT_PID! /F >nul 2>&1
  timeout /t 1 >nul
  set "PORT_PID="
)

:: ─── Launch Banner ───────────────────────────────────────────────────────────
echo.
echo   [90m─────────────────────────────────────────────────────────────[0m
echo   [96m  Claw Empire Manager[0m
echo   [90m  UI:      [0mhttp://127.0.0.1:!APP_PORT!/
echo   [90m  Health:  [0mhttp://127.0.0.1:!APP_PORT!/health
echo   [90m  SQLite:  [0mNative (--experimental-sqlite)
if "!RUN_DEV!"=="1" (
  echo   [93m  Mode:    Development (hot-reload)[0m
) else (
  echo   [90m  Mode:    Production[0m
)
echo   [90m─────────────────────────────────────────────────────────────[0m
echo.

:: ─── Launch ──────────────────────────────────────────────────────────────────
echo [INFO] Launching Claw Empire in this window...
set "NODE_OPTIONS=--experimental-sqlite"
if "!RUN_DEV!"=="1" (
  call pnpm dev
) else (
  call pnpm start
)

endlocal
exit /b 0

:: ─── Helpers ─────────────────────────────────────────────────────────────────
:find_port_pid
set "PORT_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":%~1 "') do (
  if not defined PORT_PID set "PORT_PID=%%p"
)
exit /b 0

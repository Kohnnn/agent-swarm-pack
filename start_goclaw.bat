@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title GoClaw

set "RUN_DEV=0"
set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "RUN_DOCTOR=0"
set "SKIP_BUILD=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--dev"        set "RUN_DEV=1"
if /i "%~1"=="--update"     set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--doctor"     set "RUN_DOCTOR=1"
if /i "%~1"=="--skip-build" set "SKIP_BUILD=1"
shift
goto parse_args

:args_done
set "ROOT_DIR=%~dp0"
set "PROJECT_DIR=%ROOT_DIR%goclaw"
set "APP_PORT=8080"

:: ─── Banner ──────────────────────────────────────────────────────────────────
echo.
echo   [94m╔═══════════════════════════════════════════════════════════╗[0m
echo   [94m║[0m       [96mGoClaw[0m  [37m^|[0m  AgentsSwarm Gateway Launcher              [94m║[0m
echo   [94m╚═══════════════════════════════════════════════════════════╝[0m
echo.

:: ─── Directory Guard ─────────────────────────────────────────────────────────
if not exist "!PROJECT_DIR!" (
  echo [ERROR] goclaw directory not found at: !PROJECT_DIR!
  echo [INFO]  Clone the repo first or run setup_goclaw.bat
  exit /b 1
)

:: ─── Auto-Bootstrap ──────────────────────────────────────────────────────────
set "NEEDS_SETUP=0"
if not exist "!PROJECT_DIR!\.env"       set "NEEDS_SETUP=1"
if not exist "!PROJECT_DIR!\goclaw.exe" set "NEEDS_SETUP=1"

if "!NEEDS_SETUP!"=="1" (
  echo [INFO] First-run bootstrap required. Invoking setup_goclaw.bat...
  set "SETUP_ARGS="
  if "!DO_UPDATE!"=="1"   set "SETUP_ARGS=!SETUP_ARGS! --update"
  if "!RESYNC_ENV!"=="1"  set "SETUP_ARGS=!SETUP_ARGS! --resync-env"
  call "!ROOT_DIR!setup_goclaw.bat" !SETUP_ARGS!
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

:: ─── Optional Rebuild ────────────────────────────────────────────────────────
if "!DO_UPDATE!"=="1" (
  echo [INFO] --update detected: pulling latest changes and rebuilding...
  pushd "!PROJECT_DIR!"
  git pull >nul 2>&1 || echo [WARN] git pull failed. Continuing with local state.
  if "!SKIP_BUILD!"=="0" (
    echo [INFO] Rebuilding GoClaw binary...
    go build -o goclaw.exe .
    if errorlevel 1 (
      echo [ERROR] go build failed. Fix compile errors, then retry.
      popd
      exit /b 1
    )
    echo [OK]   Rebuild successful.
  )
  popd
)

:: ─── Read Config ─────────────────────────────────────────────────────────────
for /f "tokens=1,2 delims==" %%A in ('findstr /b /c:"PORT=" "!PROJECT_DIR!\.env" 2^>nul') do set "APP_PORT=%%B"
for /f "tokens=1,2 delims==" %%A in ('findstr /b /c:"DB_HOST=" "!PROJECT_DIR!\.env" 2^>nul') do set "DB_HOST=%%B"
for /f "tokens=1,2 delims==" %%A in ('findstr /b /c:"DB_PORT=" "!PROJECT_DIR!\.env" 2^>nul') do set "DB_PORT=%%B"
if not defined DB_HOST set "DB_HOST=localhost"
if not defined DB_PORT set "DB_PORT=5432"

:: ─── Doctor / Preflight ──────────────────────────────────────────────────────
if "!RUN_DOCTOR!"=="1" (
  echo [INFO] Doctor mode: checking Go + PostgreSQL reachability...
  where go >nul 2>&1 || ( echo [ERROR] Go runtime not found in PATH. & exit /b 1 )
  echo [OK]   Go: found.
  pg_isready -h !DB_HOST! -p !DB_PORT! >nul 2>&1
  if errorlevel 1 (
    echo [WARN] PostgreSQL is not responding at !DB_HOST!:!DB_PORT!.
    echo [WARN] GoClaw will attempt to start, but database connections may fail.
  ) else (
    echo [OK]   PostgreSQL reachable at !DB_HOST!:!DB_PORT!.
  )
)

:: ─── Port Management ─────────────────────────────────────────────────────────
echo [INFO] Checking port !APP_PORT!...
call :find_port_pid !APP_PORT!
if defined PORT_PID (
  echo [INFO] Stopping existing GoClaw process on port !APP_PORT! (pid=!PORT_PID!)...
  taskkill /PID !PORT_PID! /F >nul 2>&1
  timeout /t 1 >nul
  set "PORT_PID="
)

:: ─── Launch Banner ───────────────────────────────────────────────────────────
echo.
echo   [90m─────────────────────────────────────────────────────────────[0m
echo   [96m  GoClaw Gateway[0m
echo   [90m  API:     [0mhttp://127.0.0.1:!APP_PORT!/
echo   [90m  Health:  [0mhttp://127.0.0.1:!APP_PORT!/health
echo   [90m  DB:      [0m!DB_HOST!:!DB_PORT!
if "!RUN_DEV!"=="1" (
  echo   [93m  Mode:    Development (verbose logging)[0m
) else (
  echo   [90m  Mode:    Production[0m
)
echo   [90m─────────────────────────────────────────────────────────────[0m
echo.

:: ─── Launch ──────────────────────────────────────────────────────────────────
cd /d "!PROJECT_DIR!"
if errorlevel 1 (
  echo [ERROR] Could not navigate to !PROJECT_DIR!
  exit /b 1
)

echo [INFO] Launching GoClaw runtime in this window...
if "!RUN_DEV!"=="1" (
  set "GIN_MODE=debug"
  goclaw.exe
) else (
  set "GIN_MODE=release"
  goclaw.exe
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

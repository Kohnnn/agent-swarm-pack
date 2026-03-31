@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title GoClaw Setup

set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "SKIP_BUILD=0"
set "SKIP_TESTS=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--update"     set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--skip-build" set "SKIP_BUILD=1"
if /i "%~1"=="--skip-tests" set "SKIP_TESTS=1"
shift
goto parse_args

:args_done
set "ROOT_DIR=%~dp0"
set "PROJECT_DIR=%ROOT_DIR%goclaw"

:: ─── Banner ──────────────────────────────────────────────────────────────────
echo.
echo   [94m╔═══════════════════════════════════════════════════════════╗[0m
echo   [94m║[0m     [96mGoClaw Setup[0m  [37m^|[0m  AgentsSwarm Gateway Installer       [94m║[0m
echo   [94m╚═══════════════════════════════════════════════════════════╝[0m
echo.

:: ─── Directory Guard ─────────────────────────────────────────────────────────
if not exist "!PROJECT_DIR!" (
  echo [ERROR] goclaw directory not found at: !PROJECT_DIR!
  echo [INFO]  Run: git clone https://github.com/nextlevelbuilder/goclaw goclaw
  exit /b 1
)

:: ─── [1/6] Prerequisite: Go ──────────────────────────────────────────────────
echo [1/6] Checking Go runtime...
where go >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Go is not installed or not in PATH.
  echo [INFO]  Download: https://go.dev/dl/
  exit /b 1
)
for /f "tokens=3" %%v in ('go version') do set "GO_VER=%%v"
set "GO_VER=!GO_VER:go=!"
echo [OK]   Go !GO_VER! detected.

:: ─── [2/6] Prerequisite: PostgreSQL ─────────────────────────────────────────
echo [2/6] Checking PostgreSQL availability...
where psql >nul 2>&1
if errorlevel 1 (
  echo [WARN] psql not found in PATH. Ensure PostgreSQL is installed and running.
  echo [WARN] GoClaw requires a running PostgreSQL instance. Set DATABASE_URL in .env.
) else (
  for /f "tokens=3" %%v in ('psql --version') do echo [OK]   PostgreSQL %%v detected.
)

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

:: ─── [4/6] Build ─────────────────────────────────────────────────────────────
if "!SKIP_BUILD!"=="0" (
  echo [4/6] Building GoClaw binary...
  cd /d "!PROJECT_DIR!"
  if errorlevel 1 (
    echo [ERROR] Could not enter !PROJECT_DIR!
    exit /b 1
  )
  go build -o goclaw.exe .
  if errorlevel 1 (
    echo [ERROR] go build failed. Fix compile errors above, then retry.
    exit /b 1
  )
  echo [OK]   Binary built: goclaw.exe
) else (
  echo [4/6] Skipping build. Use setup without --skip-build for full build.
)

:: ─── [5/6] Dependency Update ─────────────────────────────────────────────────
cd /d "!PROJECT_DIR!"
if "!DO_UPDATE!"=="1" (
  echo [5/6] Updating Go dependencies...
  go get -u ./...
  if errorlevel 1 echo [WARN] go get -u failed. Continuing with existing versions.
  go mod tidy
  echo [OK]   Dependencies updated.
) else (
  echo [5/6] Skipping dependency update. Use --update to pull latest.
)

:: ─── [6/6] Validation ────────────────────────────────────────────────────────
if "!SKIP_TESTS!"=="0" (
  echo [6/6] Running tests...
  go test ./...
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
echo   [92m  GoClaw setup complete![0m
echo   [90m  Next steps:[0m
echo   [90m    1. Edit [0m!PROJECT_DIR!\.env[90m — set DATABASE_URL, JWT_SECRET[0m
echo   [90m    2. Run: [0mstart_goclaw.bat
echo   [90m    3. Run: [0mstart_goclaw.bat --doctor[90m   (validate DB connection)[0m
echo   [90m─────────────────────────────────────────────────────────────[0m
echo.
endlocal
exit /b 0

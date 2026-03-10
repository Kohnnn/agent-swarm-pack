@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title AgentSwarm

set "RUN_DEV=0"
set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "WITH_SWARMCLAW=0"
set "BRIDGE_ONLY=0"
set "RUN_DOCTOR=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--dev" set "RUN_DEV=1"
if /i "%~1"=="--update" set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--with-swarmclaw" set "WITH_SWARMCLAW=1"
if /i "%~1"=="--bridge-only" set "BRIDGE_ONLY=1"
if /i "%~1"=="--doctor" set "RUN_DOCTOR=1"
shift
goto parse_args

:args_done
if not exist "%~dp0agentsswarm" (
  echo [ERROR] agentsswarm directory not found.
  exit /b 1
)

set "NEEDS_SETUP=0"
if not exist "%~dp0agentsswarm\.env" set "NEEDS_SETUP=1"
if not exist "%~dp0agentsswarm\node_modules" set "NEEDS_SETUP=1"

if "%NEEDS_SETUP%"=="1" (
  echo [INFO] Bootstrap required. Running setup_agentsswarm.bat...
  set "SETUP_ARGS=--skip-tests"
  if "%DO_UPDATE%"=="1" set "SETUP_ARGS=!SETUP_ARGS! --update"
  if "%RESYNC_ENV%"=="1" set "SETUP_ARGS=!SETUP_ARGS! --resync-env"
  if "%WITH_SWARMCLAW%"=="1" if not "%BRIDGE_ONLY%"=="1" set "SETUP_ARGS=!SETUP_ARGS! --with-swarmclaw"
  call "%~dp0setup_agentsswarm.bat" !SETUP_ARGS!
  if errorlevel 1 exit /b 1
)

cd /d "%~dp0agentsswarm"
if errorlevel 1 (
  echo [ERROR] Could not enter agentsswarm directory.
  exit /b 1
)

if "%RESYNC_ENV%"=="1" (
  call node "scripts\bootstrap-env.mjs" --strict --resync-env
) else (
  call node "scripts\bootstrap-env.mjs" --strict
)
if errorlevel 1 (
  echo [ERROR] Missing required AgentSwarm environment values.
  exit /b 1
)

call npm run preflight
if errorlevel 1 (
  echo [ERROR] AgentSwarm preflight failed. Fix the issues above, then retry.
  exit /b 1
)

if "%WITH_SWARMCLAW%"=="1" if not "%BRIDGE_ONLY%"=="1" (
  call :ensure_swarmclaw_started
)

set "BRIDGE_PORT=7799"
for /f "tokens=1,2 delims==" %%A in ('findstr /b /c:"BRIDGE_PORT=" ".env" 2^>nul') do set "BRIDGE_PORT=%%B"
set "BRIDGE_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":%BRIDGE_PORT% "') do (
  if not defined BRIDGE_PID set "BRIDGE_PID=%%p"
)
if defined BRIDGE_PID (
  echo [INFO] AgentSwarm already listening on port !BRIDGE_PORT! ^(pid=!BRIDGE_PID!^).
  set "BRIDGE_URL=http://127.0.0.1:!BRIDGE_PORT!"
  if "%RUN_DOCTOR%"=="1" (
    call npm run cli -- doctor
  ) else (
    call npm run cli -- summary
  )
  exit /b 0
)

if "%DO_UPDATE%"=="1" if "%NEEDS_SETUP%"=="0" (
  echo [INFO] Applying npm update before launch...
  call npm update
  if errorlevel 1 echo [WARN] npm update failed. Continuing with existing versions.
)

if "%RUN_DOCTOR%"=="1" (
  echo [INFO] Preflight passed. Doctor will be available after AgentSwarm is listening.
)

echo ================================================
echo   AgentSwarm starting
echo   Health:  http://127.0.0.1:!BRIDGE_PORT!/health
echo   Routes:  set BRIDGE_URL=http://127.0.0.1:!BRIDGE_PORT! ^&^& npm run cli -- routes
echo   Summary: set BRIDGE_URL=http://127.0.0.1:!BRIDGE_PORT! ^&^& npm run cli -- summary
echo ================================================

if "%RUN_DEV%"=="1" (
  call npm run dev
) else (
  call npm start
)

endlocal
exit /b 0

:ensure_swarmclaw_started
for %%p in (3456 3460 3470) do (
  for /f "tokens=5" %%x in ('netstat -ano ^| findstr LISTENING ^| findstr /C:":%%p "') do (
    echo [INFO] SwarmClaw already appears to be running on port %%p.
    exit /b 0
  )
)
if exist "%~dp0start_swarmclaw.bat" (
  echo [INFO] Starting SwarmClaw in a separate window...
  start "SwarmClaw" cmd /c call "%~dp0start_swarmclaw.bat"
) else (
  echo [WARN] start_swarmclaw.bat not found; skipping SwarmClaw auto-start.
)
exit /b 0

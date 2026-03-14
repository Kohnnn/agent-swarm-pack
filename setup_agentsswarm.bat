@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title AgentSwarm Setup

set "DO_UPDATE=0"
set "RESYNC_ENV=0"
set "INSTALL_OPENCLAW=0"
set "INSTALL_PROVIDER_CLIS=0"
set "SKIP_TESTS=0"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--update" set "DO_UPDATE=1"
if /i "%~1"=="--resync-env" set "RESYNC_ENV=1"
if /i "%~1"=="--install-openclaw" set "INSTALL_OPENCLAW=1"
if /i "%~1"=="--install-provider-clis" set "INSTALL_PROVIDER_CLIS=1"
if /i "%~1"=="--skip-tests" set "SKIP_TESTS=1"
shift
goto parse_args

:args_done
if not exist "%~dp0agentsswarm" (
  echo [ERROR] agentsswarm directory not found.
  exit /b 1
)

echo [1/6] Checking prerequisites...
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -v') do set "NODE_MAJOR_RAW=%%v"
set "NODE_MAJOR=!NODE_MAJOR_RAW:v=!"
if !NODE_MAJOR! LSS 22 (
  echo [ERROR] Node.js v22+ is required. Detected: v!NODE_MAJOR!.
  exit /b 1
)

echo [2/6] Using AgentSwarm-only setup flow.

cd /d "%~dp0agentsswarm"
if errorlevel 1 (
  echo [ERROR] Could not enter agentsswarm directory.
  exit /b 1
)

echo [3/6] Synchronizing environment...
if "%RESYNC_ENV%"=="1" (
  call node "scripts\bootstrap-env.mjs" --resync-env
) else (
  call node "scripts\bootstrap-env.mjs"
)
if errorlevel 1 (
  echo [ERROR] Failed to synchronize .env.
  exit /b 1
)

echo [4/6] Installing local dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  exit /b 1
)

if "%DO_UPDATE%"=="1" (
  echo [5/6] Updating local dependencies...
  call npm update
  if errorlevel 1 echo [WARN] npm update failed. Continuing with installed versions.
) else (
  echo [5/6] Skipping dependency update. Use --update to enable.
)

echo [6/6] Installing optional CLIs...
if "%INSTALL_OPENCLAW%"=="1" (
  call :install_cli "OpenClaw CLI" "npm install -g openclaw@latest"
)
if "%INSTALL_PROVIDER_CLIS%"=="1" (
  call :install_cli "Codex CLI" "npm install -g @openai/codex"
  call :install_cli "Claude Code" "npm install -g @anthropic-ai/claude-code"
  call :install_cli "Gemini CLI" "npm install -g @google/gemini-cli"
  call :install_cli "OpenCode CLI" "npm install -g opencode"
)
if "%INSTALL_OPENCLAW%"=="0" if "%INSTALL_PROVIDER_CLIS%"=="0" (
  echo [INFO] Skipping CLI installation. Use --install-openclaw and/or --install-provider-clis.
)

echo [Checks] Running verification...
call npm run check
if errorlevel 1 exit /b 1

if "%SKIP_TESTS%"=="1" (
  echo [INFO] Skipping tests. Use setup_agentsswarm.bat without --skip-tests for full verification.
) else (
  call npm test
  if errorlevel 1 exit /b 1
)

call npm run startup-check
if errorlevel 1 (
  echo [ERROR] Startup checks failed. Fix the blocking issues above before launch.
  exit /b 1
)

call npm run preflight
if errorlevel 1 (
  echo [WARN] Preflight is not fully green yet. Complete the missing env or CLI steps shown above.
)

echo [OK] AgentSwarm setup completed.
echo Next recommended commands:
echo - openclaw onboard --auth-choice openai-codex
echo - openclaw models auth login --provider openai-codex
echo - npm run cli -- providers
echo - npm run cli -- packs
echo - start_agentsswarm.bat --doctor
endlocal
exit /b 0

:install_cli
set "CLI_LABEL=%~1"
set "CLI_COMMAND=%~2"
echo [INFO] Installing !CLI_LABEL! ...
call !CLI_COMMAND!
if errorlevel 1 (
  echo [WARN] !CLI_LABEL! install failed. Continue manually if needed.
) else (
  echo [OK] !CLI_LABEL! installed.
)
exit /b 0

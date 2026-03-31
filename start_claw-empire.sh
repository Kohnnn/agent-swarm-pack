#!/usr/bin/env bash
set -euo pipefail

RUN_DEV=0
DO_UPDATE=0
RESYNC_ENV=0
RUN_DOCTOR=0

for arg in "$@"; do
  case "$arg" in
    --dev)        RUN_DEV=1 ;;
    --update)     DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --doctor)     RUN_DOCTOR=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${ROOT_DIR}/claw-empire"
APP_PORT=3200

# ─── Colors ───────────────────────────────────────────────────────────────────
BOLD='\033[1m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREY='\033[0;90m'
NC='\033[0m'

# ─── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}  ╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}  ║${NC}     ${CYAN}Claw Empire${NC}  ${GREY}|${NC}  AgentsSwarm Empire Manager           ${BOLD}${BLUE}║${NC}"
echo -e "${BOLD}${BLUE}  ╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Directory Guard ──────────────────────────────────────────────────────────
if [ ! -d "${PROJECT_DIR}" ]; then
  echo -e "${RED}[ERROR]${NC} claw-empire directory not found at: ${PROJECT_DIR}"
  echo -e "${GREY}[INFO]${NC}  Clone the repo first or run ./setup_claw_empire.sh"
  exit 1
fi

# ─── Auto-Bootstrap ───────────────────────────────────────────────────────────
NEEDS_SETUP=0
[ -f "${PROJECT_DIR}/.env" ]         || NEEDS_SETUP=1
[ -d "${PROJECT_DIR}/node_modules" ] || NEEDS_SETUP=1

if [ "${NEEDS_SETUP}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} First-run bootstrap required. Invoking setup_claw_empire.sh..."
  SETUP_ARGS=(--skip-tests)
  [ "${DO_UPDATE}"  -eq 1 ] && SETUP_ARGS+=(--update)
  [ "${RESYNC_ENV}" -eq 1 ] && SETUP_ARGS+=(--resync-env)
  "${ROOT_DIR}/setup_claw_empire.sh" "${SETUP_ARGS[@]}"
fi

# ─── Env Resync ───────────────────────────────────────────────────────────────
if [ "${RESYNC_ENV}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} Re-syncing .env from .env.example..."
  if [ -f "${PROJECT_DIR}/.env.example" ]; then
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    echo -e "${GREEN}[OK]${NC}   .env re-synced."
  else
    echo -e "${YELLOW}[WARN]${NC} No .env.example found — skipping resync."
  fi
fi

# ─── Read Config ──────────────────────────────────────────────────────────────
if [ -f "${PROJECT_DIR}/.env" ]; then
  ENV_PORT="$(awk -F= '/^PORT=/{print $2; exit}' "${PROJECT_DIR}/.env" 2>/dev/null || true)"
  APP_PORT="${ENV_PORT:-${APP_PORT}}"
fi

# ─── Optional Update ──────────────────────────────────────────────────────────
if [ "${DO_UPDATE}" -eq 1 ] && [ "${NEEDS_SETUP}" -eq 0 ]; then
  echo -e "${GREY}[INFO]${NC} Applying pnpm update before launch..."
  (cd "${PROJECT_DIR}" && pnpm update) || echo -e "${YELLOW}[WARN]${NC} pnpm update failed. Continuing with existing versions."
fi

# ─── Doctor / Preflight ───────────────────────────────────────────────────────
cd "${PROJECT_DIR}"

if [ "${RUN_DOCTOR}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} Doctor mode: checking Node.js + pnpm + SQLite..."
  command -v node > /dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} Node.js not found in PATH."; exit 1; }
  echo -e "${GREEN}[OK]${NC}   Node.js: $(node -v)."
  if command -v pnpm > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC}   pnpm: $(pnpm -v)."
  else
    echo -e "${YELLOW}[WARN]${NC} pnpm not found. Install via: npm install -g pnpm"
  fi
  echo -e "${GREY}[INFO]${NC} SQLite: using Node.js --experimental-sqlite (built-in)."
  if [ -f "package.json" ]; then
    node -e "const p=require('./package.json');console.log('[OK]   Package: '+p.name+' v'+p.version);"
  fi
fi

# ─── Port Management ──────────────────────────────────────────────────────────
find_port_pid() {
  local port="$1"
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1; return 0
  fi
  if command -v ss > /dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v t=":${port}" '$4 ~ t {print $NF}' \
      | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n 1; return 0
  fi
  return 1
}

check_port() {
  local port="$1"
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t > /dev/null 2>&1; return $?
  fi
  if command -v ss > /dev/null 2>&1; then
    ss -ltn | grep -q ":${port} "; return $?
  fi
  return 1
}

echo -e "${GREY}[INFO]${NC} Checking port ${APP_PORT}..."
if check_port "${APP_PORT}"; then
  EXISTING_PID="$(find_port_pid "${APP_PORT}" || true)"
  echo -e "${GREY}[INFO]${NC} Stopping existing Claw Empire process on port ${APP_PORT}${EXISTING_PID:+ (pid=${EXISTING_PID})}..."
  if [ -n "${EXISTING_PID}" ]; then
    kill "${EXISTING_PID}" > /dev/null 2>&1 || true
  else
    pkill -f "node" > /dev/null 2>&1 || true
  fi
  sleep 1
fi

# ─── Launch Banner ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}${CYAN}  Claw Empire Manager${NC}"
echo -e "${GREY}  UI:      ${NC}http://127.0.0.1:${APP_PORT}/"
echo -e "${GREY}  Health:  ${NC}http://127.0.0.1:${APP_PORT}/health"
echo -e "${GREY}  SQLite:  ${NC}Native (--experimental-sqlite)"
if [ "${RUN_DEV}" -eq 1 ]; then
  echo -e "${YELLOW}  Mode:    Development (hot-reload)${NC}"
else
  echo -e "${GREY}  Mode:    Production${NC}"
fi
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo ""

# ─── Launch ───────────────────────────────────────────────────────────────────
export NODE_OPTIONS="--experimental-sqlite"
echo -e "${GREY}[INFO]${NC} Launching Claw Empire in this shell..."
if [ "${RUN_DEV}" -eq 1 ]; then
  pnpm dev
else
  pnpm start
fi

#!/usr/bin/env bash
set -euo pipefail

RUN_DEV=0
DO_UPDATE=0
RESYNC_ENV=0
RUN_DOCTOR=0
SKIP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --dev)        RUN_DEV=1 ;;
    --update)     DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --doctor)     RUN_DOCTOR=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${ROOT_DIR}/goclaw"
APP_PORT=8080

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
echo -e "${BOLD}${BLUE}  ║${NC}       ${CYAN}GoClaw${NC}  ${GREY}|${NC}  AgentsSwarm Gateway Launcher              ${BOLD}${BLUE}║${NC}"
echo -e "${BOLD}${BLUE}  ╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Directory Guard ──────────────────────────────────────────────────────────
if [ ! -d "${PROJECT_DIR}" ]; then
  echo -e "${RED}[ERROR]${NC} goclaw directory not found at: ${PROJECT_DIR}"
  echo -e "${GREY}[INFO]${NC}  Clone the repo first or run ./setup_goclaw.sh"
  exit 1
fi

# ─── Auto-Bootstrap ───────────────────────────────────────────────────────────
NEEDS_SETUP=0
[ -f "${PROJECT_DIR}/.env" ]    || NEEDS_SETUP=1
[ -f "${PROJECT_DIR}/goclaw" ]  || NEEDS_SETUP=1

if [ "${NEEDS_SETUP}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} First-run bootstrap required. Invoking setup_goclaw.sh..."
  SETUP_ARGS=()
  [ "${DO_UPDATE}"  -eq 1 ] && SETUP_ARGS+=(--update)
  [ "${RESYNC_ENV}" -eq 1 ] && SETUP_ARGS+=(--resync-env)
  "${ROOT_DIR}/setup_goclaw.sh" "${SETUP_ARGS[@]}"
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

# ─── Optional Rebuild ─────────────────────────────────────────────────────────
if [ "${DO_UPDATE}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} --update detected: pulling latest changes and rebuilding..."
  (cd "${PROJECT_DIR}" && git pull > /dev/null 2>&1) || echo -e "${YELLOW}[WARN]${NC} git pull failed. Continuing with local state."
  if [ "${SKIP_BUILD}" -eq 0 ]; then
    echo -e "${GREY}[INFO]${NC} Rebuilding GoClaw binary..."
    (cd "${PROJECT_DIR}" && go build -o goclaw .)
    echo -e "${GREEN}[OK]${NC}   Rebuild successful."
  fi
fi

# ─── Read Config ──────────────────────────────────────────────────────────────
if [ -f "${PROJECT_DIR}/.env" ]; then
  ENV_PORT="$(awk -F= '/^PORT=/{print $2; exit}' "${PROJECT_DIR}/.env" 2>/dev/null)"
  DB_HOST="$(awk -F= '/^DB_HOST=/{print $2; exit}' "${PROJECT_DIR}/.env" 2>/dev/null)"
  DB_PORT="$(awk -F= '/^DB_PORT=/{print $2; exit}' "${PROJECT_DIR}/.env" 2>/dev/null)"
  APP_PORT="${ENV_PORT:-${APP_PORT}}"
fi
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# ─── Doctor / Preflight ───────────────────────────────────────────────────────
if [ "${RUN_DOCTOR}" -eq 1 ]; then
  echo -e "${GREY}[INFO]${NC} Doctor mode: checking Go + PostgreSQL reachability..."
  command -v go > /dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} Go runtime not found in PATH."; exit 1; }
  echo -e "${GREEN}[OK]${NC}   Go: found ($(go version | awk '{print $3}'))."
  if command -v pg_isready > /dev/null 2>&1; then
    if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" > /dev/null 2>&1; then
      echo -e "${GREEN}[OK]${NC}   PostgreSQL reachable at ${DB_HOST}:${DB_PORT}."
    else
      echo -e "${YELLOW}[WARN]${NC} PostgreSQL is not responding at ${DB_HOST}:${DB_PORT}."
      echo -e "${YELLOW}[WARN]${NC} GoClaw will attempt to start, but database connections may fail."
    fi
  else
    echo -e "${YELLOW}[WARN]${NC} pg_isready not found — skipping DB connectivity check."
  fi
fi

# ─── Port Management ──────────────────────────────────────────────────────────
find_port_pid() {
  local port="$1"
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1
    return 0
  fi
  if command -v ss > /dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v t=":${port}" '$4 ~ t {print $NF}' \
      | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n 1
    return 0
  fi
  return 1
}

check_port() {
  local port="$1"
  if command -v lsof > /dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t > /dev/null 2>&1
    return $?
  fi
  if command -v ss > /dev/null 2>&1; then
    ss -ltn | grep -q ":${port} "
    return $?
  fi
  return 1
}

echo -e "${GREY}[INFO]${NC} Checking port ${APP_PORT}..."
if check_port "${APP_PORT}"; then
  EXISTING_PID="$(find_port_pid "${APP_PORT}" || true)"
  echo -e "${GREY}[INFO]${NC} Stopping existing GoClaw process on port ${APP_PORT}${EXISTING_PID:+ (pid=${EXISTING_PID})}..."
  if [ -n "${EXISTING_PID}" ]; then
    kill "${EXISTING_PID}" > /dev/null 2>&1 || true
  else
    pkill -f "goclaw" > /dev/null 2>&1 || true
  fi
  sleep 1
fi

# ─── Launch Banner ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}${CYAN}  GoClaw Gateway${NC}"
echo -e "${GREY}  API:     ${NC}http://127.0.0.1:${APP_PORT}/"
echo -e "${GREY}  Health:  ${NC}http://127.0.0.1:${APP_PORT}/health"
echo -e "${GREY}  DB:      ${NC}${DB_HOST}:${DB_PORT}"
if [ "${RUN_DEV}" -eq 1 ]; then
  echo -e "${YELLOW}  Mode:    Development (verbose logging)${NC}"
else
  echo -e "${GREY}  Mode:    Production${NC}"
fi
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo ""

# ─── Launch ───────────────────────────────────────────────────────────────────
cd "${PROJECT_DIR}"
echo -e "${GREY}[INFO]${NC} Launching GoClaw runtime in this shell..."

if [ "${RUN_DEV}" -eq 1 ]; then
  GIN_MODE=debug ./goclaw
else
  GIN_MODE=release ./goclaw
fi

#!/usr/bin/env bash
set -e

RUN_DEV=0
DO_UPDATE=0
RESYNC_ENV=0
WITH_SWARMCLAW=0
BRIDGE_ONLY=0
RUN_DOCTOR=0

for arg in "$@"; do
  case "$arg" in
    --dev) RUN_DEV=1 ;;
    --update) DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --with-swarmclaw) WITH_SWARMCLAW=1 ;;
    --bridge-only) BRIDGE_ONLY=1 ;;
    --doctor) RUN_DOCTOR=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_DIR="${ROOT_DIR}/agentsswarm"

if [ ! -d "${BRIDGE_DIR}" ]; then
  echo "[ERROR] agentsswarm directory not found."
  exit 1
fi

NEEDS_SETUP=0
[ -f "${BRIDGE_DIR}/.env" ] || NEEDS_SETUP=1
[ -d "${BRIDGE_DIR}/node_modules" ] || NEEDS_SETUP=1

if [ "${NEEDS_SETUP}" -eq 1 ]; then
  echo "[INFO] Bootstrap required. Running setup_agentsswarm.sh..."
  SETUP_ARGS=(--skip-tests)
  [ "${DO_UPDATE}" -eq 1 ] && SETUP_ARGS+=(--update)
  [ "${RESYNC_ENV}" -eq 1 ] && SETUP_ARGS+=(--resync-env)
  if [ "${WITH_SWARMCLAW}" -eq 1 ] && [ "${BRIDGE_ONLY}" -eq 0 ]; then
    SETUP_ARGS+=(--with-swarmclaw)
  fi
  "${ROOT_DIR}/setup_agentsswarm.sh" "${SETUP_ARGS[@]}"
fi

cd "${BRIDGE_DIR}"
if [ "${RESYNC_ENV}" -eq 1 ]; then
  node "scripts/bootstrap-env.mjs" --strict --resync-env
else
  node "scripts/bootstrap-env.mjs" --strict
fi

npm run preflight

check_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | grep -q ":${port} "
    return $?
  fi
  return 1
}

if [ "${WITH_SWARMCLAW}" -eq 1 ] && [ "${BRIDGE_ONLY}" -eq 0 ]; then
  if ! check_port_in_use 3456 && ! check_port_in_use 3460 && ! check_port_in_use 3470; then
    if [ -x "${ROOT_DIR}/start_swarmclaw.sh" ]; then
      echo "[INFO] Starting SwarmClaw in the background..."
      nohup "${ROOT_DIR}/start_swarmclaw.sh" >/tmp/agentsswarm-swarmclaw.log 2>&1 &
    else
      echo "[WARN] start_swarmclaw.sh not found or not executable; skipping SwarmClaw auto-start."
    fi
  else
    echo "[INFO] SwarmClaw already appears to be running."
  fi
fi

BRIDGE_PORT="$(awk -F= '/^BRIDGE_PORT=/{print $2; exit}' .env 2>/dev/null)"
BRIDGE_PORT="${BRIDGE_PORT:-7799}"

if check_port_in_use "${BRIDGE_PORT}"; then
  echo "[INFO] AgentSwarm already listening on port ${BRIDGE_PORT}."
  if [ "${RUN_DOCTOR}" -eq 1 ]; then
    BRIDGE_URL="http://127.0.0.1:${BRIDGE_PORT}" npm run cli -- doctor || true
  else
    BRIDGE_URL="http://127.0.0.1:${BRIDGE_PORT}" npm run cli -- summary || true
  fi
  exit 0
fi

if [ "${DO_UPDATE}" -eq 1 ] && [ "${NEEDS_SETUP}" -eq 0 ]; then
  echo "[INFO] Applying npm update before launch..."
  npm update || echo "[WARN] npm update failed. Continuing with existing versions."
fi

if [ "${RUN_DOCTOR}" -eq 1 ]; then
  echo "[INFO] Preflight passed. Doctor will be available after AgentSwarm is listening."
fi

echo "================================================"
echo "  AgentSwarm starting"
echo "  Health:  http://127.0.0.1:${BRIDGE_PORT}/health"
echo "  Routes:  BRIDGE_URL=http://127.0.0.1:${BRIDGE_PORT} npm run cli -- routes"
echo "  Summary: BRIDGE_URL=http://127.0.0.1:${BRIDGE_PORT} npm run cli -- summary"
echo "================================================"

if [ "${RUN_DEV}" -eq 1 ]; then
  npm run dev
else
  npm start
fi

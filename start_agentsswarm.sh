#!/usr/bin/env bash
set -e

RUN_DEV=0
DO_UPDATE=0
RESYNC_ENV=0
RUN_DOCTOR=0
FORCE_RESTART=0

for arg in "$@"; do
  case "$arg" in
    --dev) RUN_DEV=1 ;;
    --update) DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --doctor) RUN_DOCTOR=1 ;;
    --restart) FORCE_RESTART=1 ;;
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
  "${ROOT_DIR}/setup_agentsswarm.sh" "${SETUP_ARGS[@]}"
fi

cd "${BRIDGE_DIR}"
if [ "${RESYNC_ENV}" -eq 1 ]; then
  node "scripts/bootstrap-env.mjs" --startup --strict --resync-env
else
  node "scripts/bootstrap-env.mjs" --startup --strict
fi

if ! npm run startup-check; then
  echo "[ERROR] AgentSwarm startup checks failed. Fix the blocking issues above, then retry."
  exit 1
fi

EXECUTION_BACKEND="$(awk -F= '/^EXECUTION_BACKEND=/{print $2; exit}' .env 2>/dev/null)"
EXECUTION_BACKEND="${EXECUTION_BACKEND:-standalone}"
CONNECTOR_BACKEND="$(awk -F= '/^CONNECTOR_BACKEND=/{print $2; exit}' .env 2>/dev/null)"
CONNECTOR_BACKEND="${CONNECTOR_BACKEND:-none}"

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

if [ "${EXECUTION_BACKEND}" = "remote_api" ] && ! check_port_in_use 8790; then
  echo "[WARN] Remote execution API is not detected on port 8790."
  echo "[WARN] AgentSwarm will still start, but remote execution flows will fail until REMOTE_API_URL is reachable."
fi

BRIDGE_PORT="$(awk -F= '/^BRIDGE_PORT=/{print $2; exit}' .env 2>/dev/null)"
BRIDGE_PORT="${BRIDGE_PORT:-7799}"
UI_PORT="$(awk -F= '/^UI_PORT=/{print $2; exit}' .env 2>/dev/null)"
UI_PORT="${UI_PORT:-7800}"

if check_port_in_use "${BRIDGE_PORT}"; then
  if [ "${FORCE_RESTART}" -eq 1 ] && command -v lsof >/dev/null 2>&1; then
    EXISTING_PID="$(lsof -iTCP:${BRIDGE_PORT} -sTCP:LISTEN -t | head -n 1)"
    if [ -n "${EXISTING_PID}" ]; then
      echo "[INFO] Restart requested. Stopping existing AgentSwarm process ${EXISTING_PID} ..."
      kill "${EXISTING_PID}" >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
fi

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
  echo "[INFO] Startup checks passed. Doctor will be available after AgentSwarm is listening."
fi

echo "================================================"
echo "  AgentSwarm starting"
echo "  Service: secure local control plane with browser dashboard"
echo "  Execution Backend: ${EXECUTION_BACKEND}"
echo "  Connector Backend: ${CONNECTOR_BACKEND}"
echo "  Dashboard: http://127.0.0.1:${BRIDGE_PORT}/"
echo "  SPA UI:  http://127.0.0.1:${UI_PORT}/dashboard (run: npm run dev:web)"
echo "  Health:  http://127.0.0.1:${BRIDGE_PORT}/health"
echo "  Tasks:   http://127.0.0.1:${BRIDGE_PORT}/tasks"
echo "  Routes:  BRIDGE_URL=http://127.0.0.1:${BRIDGE_PORT} npm run cli -- routes"
echo "  Resolve: BRIDGE_URL=http://127.0.0.1:${BRIDGE_PORT} npm run cli -- resolve-route --channel engineering"
echo "  Summary: BRIDGE_URL=http://127.0.0.1:${BRIDGE_PORT} npm run cli -- summary"
echo "================================================"

if [ "${RUN_DEV}" -eq 1 ]; then
  npm run dev
else
  npm start
fi

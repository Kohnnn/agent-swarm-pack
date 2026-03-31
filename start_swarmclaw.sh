#!/usr/bin/env bash

# ============================================================
#  SwarmClaw Premium Launcher
#  Target OS  : macOS / Linux / WSL
# ============================================================

set -e

# Colors
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

RUN_DEV=0
DO_UPDATE=0
RESYNC_ENV=0
RUN_DOCTOR=0
PORT=3456

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) RUN_DEV=1 ;;
        --update) DO_UPDATE=1 ;;
        --resync-env) RESYNC_ENV=1 ;;
        --doctor) RUN_DOCTOR=1 ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NEEDS_SETUP=0
if [ ! -d "$SCRIPT_DIR/swarmclaw" ]; then NEEDS_SETUP=1; fi
if [ ! -f "$SCRIPT_DIR/swarmclaw/.env" ]; then NEEDS_SETUP=1; fi
if [ ! -d "$SCRIPT_DIR/swarmclaw/node_modules" ]; then NEEDS_SETUP=1; fi

if [ "$NEEDS_SETUP" -eq 1 ]; then
    echo -e "[INFO] Bootstrap required. Running setup_swarmclaw.sh..."
    bash "$SCRIPT_DIR/setup_swarmclaw.sh"
fi

cd "$SCRIPT_DIR/swarmclaw"

# Handle explicit update
if [ "$DO_UPDATE" -eq 1 ]; then
    echo -e "[INFO] Updating SwarmClaw..."
    bash "$SCRIPT_DIR/setup_swarmclaw.sh" --update
fi

# Port Management
echo -e "[INFO] Checking port $PORT..."
PID=$(lsof -t -i:$PORT 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo -e "[INFO] Stopping existing SwarmClaw process on port $PORT (pid=$PID)..."
    kill -9 $PID
    sleep 1
fi

echo -e "\n${BLUE}========================================================${NC}"
echo -e "${BLUE}   SwarmClaw starting${NC}"
echo -e "${BLUE}   Dashboard: http://127.0.0.1:$PORT${NC}"
echo -e "${BLUE}========================================================${NC}\n"

if [ "$RUN_DEV" -eq 1 ]; then
    npm run dev
else
    npm start
fi

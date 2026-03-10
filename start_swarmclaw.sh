#!/usr/bin/env bash

# ============================================================
#  SwarmClaw Daily Launcher
#  Target OS: macOS / Linux
# ============================================================

set -e

cd "$(dirname "$0")/swarmclaw" || {
    echo "[ERROR] Could not enter swarmclaw directory."
    echo "        Run ./setup_swarmclaw.sh first."
    exit 1
}

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

LOCK_FILE=".next/dev/lock"
ACTIVE_PORT=""
for port in 3456 3460 3470; do
    if check_port_in_use "$port"; then
        ACTIVE_PORT="$port"
        break
    fi
done

if [ -f "$LOCK_FILE" ]; then
    if [ -n "$ACTIVE_PORT" ]; then
        echo "[INFO] Existing SwarmClaw dev server appears to be running."
        echo "       Open: http://127.0.0.1:${ACTIVE_PORT}"
        echo "       Stop the old server first if you want to restart on a different port."
        exit 0
    fi

    echo "[WARN] Found stale Next.js lock file. Removing it..."
    rm -f "$LOCK_FILE"
fi

SWARMCLAW_PORT=3456
if check_port_in_use "$SWARMCLAW_PORT"; then
    echo "[WARN] Port 3456 is already in use. Trying fallback ports..."
    for port in 3460 3470; do
        if ! check_port_in_use "$port"; then
            SWARMCLAW_PORT="$port"
            break
        fi
    done
fi

if check_port_in_use "$SWARMCLAW_PORT"; then
    echo "[ERROR] Ports 3456, 3460, and 3470 are all in use."
    echo "        Stop existing process or run manually with a free port."
    exit 1
fi

echo ""
echo "========================================================"
echo "   SwarmClaw  -  Starting dev server"
echo "   UI will be at: http://127.0.0.1:${SWARMCLAW_PORT}"
echo "========================================================"
echo ""

if [ "$SWARMCLAW_PORT" = "3456" ]; then
    npm run dev
else
    node ./node_modules/next/dist/bin/next dev --webpack --hostname 0.0.0.0 -p "$SWARMCLAW_PORT"
fi

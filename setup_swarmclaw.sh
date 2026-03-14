#!/usr/bin/env bash

# ============================================================
#  SwarmClaw 1-Click Setup for OpenClaw Agent Swarm
#  Target OS  : macOS / Linux
#  Repository : https://github.com/swarmclawai/swarmclaw
# ============================================================

set -e

echo ""
echo "========================================================"
echo "   SwarmClaw  -  1-Click Setup Script"
echo "   OpenClaw Agent Swarm Control Plane"
echo "========================================================"
echo ""

echo "[1/4] Checking prerequisites..."
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "        Please install Node.js v22.6+ from https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VER" -lt 22 ]; then
    echo "[ERROR] Node.js v22.6+ is required. Detected: v$NODE_VER."
    exit 1
fi
echo "  [OK] Node.js v$NODE_VER detected"

if ! command -v git >/dev/null 2>&1; then
    echo "[ERROR] Git is not installed or not in PATH."
    echo "        Please install Git from https://git-scm.com/"
    exit 1
fi
echo "  [OK] Git detected"

if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm is not installed or not in PATH."
    echo "        Please install Node.js + npm from https://nodejs.org/"
    exit 1
fi
echo "  [OK] npm detected"
echo ""

echo "[2/4] Cloning and installing swarmclaw..."
echo ""

if [ -d "swarmclaw" ]; then
    echo "  [INFO] Directory 'swarmclaw' already exists."
    SWARMCLAW_EXISTS=1
else
    echo "  Cloning repository https://github.com/swarmclawai/swarmclaw ..."
    git clone https://github.com/swarmclawai/swarmclaw.git
    echo "  [OK] Repository cloned"
    SWARMCLAW_EXISTS=0
fi

cd swarmclaw

if [ "$SWARMCLAW_EXISTS" -eq 1 ]; then
    echo "  [UPDATE] Checking for updates from remote repository..."
    if ! git pull; then
        echo "  [WARN] Could not pull latest changes. Continuing with existing files."
    else
        echo "  [OK] Repository updated"
    fi
fi

echo "  Installing dependencies..."
npm install
echo "  [OK] Dependencies installed"

echo "  Bootstrapping local runtime files..."
npm run setup:easy -- --skip-install
echo "  [OK] Local runtime prepared"
echo ""

echo "[3/4] Validating local config..."
echo ""

if [ -f ".env.local" ]; then
    echo "  [OK] .env.local found"
else
    echo "  [WARN] .env.local not found yet. It will be generated on first run."
fi

if [ -d "data" ]; then
    echo "  [OK] data directory found"
else
    echo "  [WARN] data directory not found yet. It will be created on first run."
fi
echo ""

echo "[4/4] Finalizing..."
echo ""
echo "========================================================"
echo "   Setup complete!"
echo "========================================================"
echo ""
echo "  OPTION 1 - Use the launcher (recommended):"
echo "    ./start_swarmclaw.sh"
echo ""
echo "  OPTION 2 - Manual start from swarmclaw directory:"
echo "    npm run dev"
echo ""
echo "  Then open:  http://127.0.0.1:3456  in your browser"
echo ""
echo "  First run prints ACCESS KEY in terminal."
echo "  Save it in your password manager before closing terminal."
echo ""

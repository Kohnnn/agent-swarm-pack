#!/usr/bin/env bash

# ============================================================
#  SwarmClaw 1-Click Setup for AI Agent Orchestration
#  Target OS  : macOS / Linux / WSL
#  Repository : https://github.com/swarmclawai/swarmclaw.git
# ============================================================

set -e

# Colors
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

DO_UPDATE=0
SKIP_TESTS=0

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --update) DO_UPDATE=1 ;;
        --skip-tests) SKIP_TESTS=1 ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo -e "\n${BLUE}========================================================${NC}"
echo -e "${BLUE}   SwarmClaw  -  1-Click Setup Script${NC}"
echo -e "${BLUE}   AI Agent Orchestration Dashboard${NC}"
echo -e "${BLUE}========================================================${NC}\n"

# ============================================================
# 1. PREREQUISITE CHECKS
# ============================================================
echo -e "[1/5] Checking prerequisites..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed.${NC}"
    exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VER" -lt 22 ]; then
    echo -e "${RED}[ERROR] Node.js v22+ is required. Detected: v$NODE_VER${NC}"
    exit 1
fi
echo -e "  [OK] Node.js v$(node -v) detected"

# Check Git
if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Git is not installed.${NC}"
    exit 1
fi
echo -e "  [OK] Git $(git --version | awk '{print $3}') detected"
echo ""

# ============================================================
# 2. CLONE & INSTALL
# ============================================================
echo -e "[2/5] Cloning and installing SwarmClaw..."

if [ -d "swarmclaw" ]; then
    echo -e "  [INFO] Directory 'swarmclaw' already exists."
else
    echo -e "  Cloning repository https://github.com/swarmclawai/swarmclaw.git ..."
    git clone https://github.com/swarmclawai/swarmclaw.git
    echo -e "  [OK] Repository cloned"
fi

cd swarmclaw

# Always pull latest update
echo -e "  [UPDATE] Pulling latest changes from remote..."
if ! git pull; then
    echo -e "  ${YELLOW}[WARN] Could not pull latest changes. Continuing with existing files.${NC}"
else
    echo -e "  [OK] Repository up to date"
fi

# Install dependencies
echo -e "\n  Installing dependencies..."
npm install
echo -e "  [OK] Dependencies installed"
echo ""

# ============================================================
# 3. ENVIRONMENT CONFIGURATION
# ============================================================
echo -e "[3/5] Configuring environment variables..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "  [OK] Created .env from .env.example"
    else
        echo -e "  [WARN] .env.example not found. Creating minimal .env..."
        cat <<EOF > .env
PORT=3456
NODE_ENV=development
EOF
        echo -e "  [OK] Created minimal .env"
    fi
else
    echo -e "  [OK] .env already exists"
fi
echo ""

# ============================================================
# 4. VERIFICATION
# ============================================================
echo -e "[4/5] Running verification..."

if [ "$SKIP_TESTS" -eq 1 ]; then
    echo -e "  [INFO] Skipping tests."
else
    if npm run check >/dev/null 2>&1; then
        echo -e "  [OK] Basic checks passed"
    else
        echo -e "  ${YELLOW}[WARN] Health check returned warnings.${NC}"
    fi
fi
echo ""

# ============================================================
# 5. FINALIZATION
# ============================================================
echo -e "[5/5] Finalizing..."

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}   Setup complete!${NC}"
echo -e "${GREEN}========================================================${NC}\n"
echo -e "  To launch SwarmClaw:"
echo -e "    ./start_swarmclaw.sh (in the root folder)"
echo ""
echo -e "  Then open: http://127.0.0.1:3456 in your browser\n"

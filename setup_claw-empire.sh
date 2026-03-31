#!/bin/bash
PROJECT_DIR="claw-empire"
REQUIRED_NODE=22

BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${BLUE}┌────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│                                                        │${NC}"
echo -e "${BLUE}│          ${CYAN}AgentsSwarm: Claw Empire Setup${NC}               ${BLUE}│${NC}"
echo -e "${BLUE}│                                                        │${NC}"
echo -e "${BLUE}└────────────────────────────────────────────────────────┘${NC}\n"

# [1/5] Prerequisite Check: Node
echo -e "${NC}[1/5]${NC} Checking Node.js version..."
NODE_VER=$(node -v 2>/dev/null | sed 's/v//')
NODE_MAJOR=$(echo $NODE_VER | cut -d. -f1)

if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt "$REQUIRED_NODE" ]; then
    echo -e "${RED}[ERROR] Node.js version $REQUIRED_NODE+ is required.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Found Node.js $NODE_VER"

# [2/5] Prerequisite Check: pnpm
echo -e "${NC}[2/5]${NC} Checking pnpm availability..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}[ERROR] pnpm not found. Please install it.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Found pnpm."

# [3/5] Submodule Check
echo -e "${NC}[3/5]${NC} Initializing submodules..."
cd "$PROJECT_DIR" || exit
git submodule update --init --recursive
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[WARN] Submodule update failed or not a git repo.${NC}"
else
    echo -e "${GREEN}[OK]${NC} Submodules ready."
fi
cd ..

# [4/5] Environment Bootstrapping
echo -e "${NC}[4/5]${NC} Bootstrapping environment..."
if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/.env.example" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo -e "${GREEN}[OK]${NC} Created .env from .env.example"
elif [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}[OK]${NC} .env already exists."
fi

# [5/5] Dependencies
echo -e "${NC}[5/5]${NC} Installing dependencies..."
cd "$PROJECT_DIR" || exit
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] pnpm install failed.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}[OK]${NC} Dependencies installed."

# Finalization
echo -e "\n${GREEN}[SUCCESS]${NC} Claw Empire setup complete!"
echo -e "Run ${CYAN}./start_claw-empire.sh${NC} to launch the Discord swarm.\n"

#!/usr/bin/env bash
set -euo pipefail

DO_UPDATE=0
RESYNC_ENV=0
SKIP_TESTS=0

for arg in "$@"; do
  case "$arg" in
    --update)     DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${ROOT_DIR}/paperclip"
REQUIRED_NODE=22

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
echo -e "${BOLD}${BLUE}  ║${NC}   ${CYAN}Paperclip Setup${NC}  ${GREY}|${NC}  AgentsSwarm AI Task Installer      ${BOLD}${BLUE}║${NC}"
echo -e "${BOLD}${BLUE}  ╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Directory Guard ──────────────────────────────────────────────────────────
if [ ! -d "${PROJECT_DIR}" ]; then
  echo -e "${RED}[ERROR]${NC} paperclip directory not found at: ${PROJECT_DIR}"
  echo -e "${GREY}[INFO]${NC}  Run: git clone https://github.com/paperclipai/paperclip paperclip"
  exit 1
fi

# ─── [1/6] Prerequisite: Node.js ──────────────────────────────────────────────
echo -e "${GREY}[1/6]${NC} Checking Node.js runtime..."
command -v node > /dev/null 2>&1 || {
  echo -e "${RED}[ERROR]${NC} Node.js is not installed or not in PATH."
  echo -e "${GREY}[INFO]${NC}  Download: https://nodejs.org/"
  exit 1
}
NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d'.' -f1)"
if [ "${NODE_MAJOR}" -lt "${REQUIRED_NODE}" ]; then
  echo -e "${RED}[ERROR]${NC} Node.js v${REQUIRED_NODE}+ required. Detected: v${NODE_MAJOR}."
  exit 1
fi
echo -e "${GREEN}[OK]${NC}   Node.js $(node -v) detected."

# ─── [2/6] Prerequisite: pnpm ─────────────────────────────────────────────────
echo -e "${GREY}[2/6]${NC} Checking pnpm..."
if ! command -v pnpm > /dev/null 2>&1; then
  echo -e "${YELLOW}[WARN]${NC} pnpm not found. Installing globally..."
  npm install -g pnpm || {
    echo -e "${RED}[ERROR]${NC} Could not install pnpm. Resolve manually: npm install -g pnpm"
    exit 1
  }
fi
echo -e "${GREEN}[OK]${NC}   pnpm $(pnpm -v) detected."

# ─── [3/6] Environment Bootstrap ─────────────────────────────────────────────
echo -e "${GREY}[3/6]${NC} Bootstrapping environment..."
if [ "${RESYNC_ENV}" -eq 1 ]; then
  if [ -f "${PROJECT_DIR}/.env.example" ]; then
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    echo -e "${GREEN}[OK]${NC}   .env force-resynced from .env.example."
  else
    echo -e "${YELLOW}[WARN]${NC} No .env.example found — skipping resync."
  fi
elif [ ! -f "${PROJECT_DIR}/.env" ]; then
  if [ -f "${PROJECT_DIR}/.env.example" ]; then
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    echo -e "${GREEN}[OK]${NC}   Created .env from .env.example."
    echo -e "${GREY}[INFO]${NC} Generating secure random secret..."
    SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
    sed -i "s/CHANGE_ME/${SECRET}/g" "${PROJECT_DIR}/.env" 2>/dev/null || true
    echo -e "${GREEN}[OK]${NC}   Secrets generated."
  else
    echo -e "${YELLOW}[WARN]${NC} No .env.example found. Create ${PROJECT_DIR}/.env manually."
  fi
else
  echo -e "${GREEN}[OK]${NC}   .env already exists. Use --resync-env to overwrite."
fi

# ─── [4/6] Dependencies ───────────────────────────────────────────────────────
echo -e "${GREY}[4/6]${NC} Installing dependencies..."
cd "${PROJECT_DIR}"
pnpm install
echo -e "${GREEN}[OK]${NC}   Dependencies installed."

# ─── [5/6] Update ─────────────────────────────────────────────────────────────
if [ "${DO_UPDATE}" -eq 1 ]; then
  echo -e "${GREY}[5/6]${NC} Updating dependencies..."
  pnpm update || echo -e "${YELLOW}[WARN]${NC} pnpm update failed. Continuing with installed versions."
  echo -e "${GREEN}[OK]${NC}   Dependencies up to date."
else
  echo -e "${GREY}[5/6]${NC} Skipping dependency update. Use --update to pull latest."
fi

# ─── [6/6] Validation ─────────────────────────────────────────────────────────
if [ "${SKIP_TESTS}" -eq 0 ]; then
  echo -e "${GREY}[6/6]${NC} Running tests..."
  if pnpm test; then
    echo -e "${GREEN}[OK]${NC}   All tests passed."
  else
    echo -e "${YELLOW}[WARN]${NC} Some tests failed. Resolve before production use."
  fi
else
  echo -e "${GREY}[6/6]${NC} Skipping tests. Run without --skip-tests for full verification."
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}${GREEN}  Paperclip setup complete!${NC}"
echo -e "${GREY}  Next steps:${NC}"
echo -e "${GREY}    1. Edit ${NC}${PROJECT_DIR}/.env${GREY} — set OPENAI_API_KEY and other keys${NC}"
echo -e "${GREY}    2. Run: ${NC}./start_paperclip.sh"
echo -e "${GREY}    3. Run: ${NC}./start_paperclip.sh --doctor${GREY}   (pre-flight check)${NC}"
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo ""

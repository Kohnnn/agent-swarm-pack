#!/usr/bin/env bash
set -euo pipefail

DO_UPDATE=0
RESYNC_ENV=0
SKIP_BUILD=0
SKIP_TESTS=0

for arg in "$@"; do
  case "$arg" in
    --update)     DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${ROOT_DIR}/goclaw"

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
echo -e "${BOLD}${BLUE}  ║${NC}     ${CYAN}GoClaw Setup${NC}  ${GREY}|${NC}  AgentsSwarm Gateway Installer       ${BOLD}${BLUE}║${NC}"
echo -e "${BOLD}${BLUE}  ╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Directory Guard ──────────────────────────────────────────────────────────
if [ ! -d "${PROJECT_DIR}" ]; then
  echo -e "${RED}[ERROR]${NC} goclaw directory not found at: ${PROJECT_DIR}"
  echo -e "${GREY}[INFO]${NC}  Run: git clone https://github.com/nextlevelbuilder/goclaw goclaw"
  exit 1
fi

# ─── [1/6] Prerequisite: Go ───────────────────────────────────────────────────
echo -e "${GREY}[1/6]${NC} Checking Go runtime..."
command -v go > /dev/null 2>&1 || {
  echo -e "${RED}[ERROR]${NC} Go is not installed or not in PATH."
  echo -e "${GREY}[INFO]${NC}  Download: https://go.dev/dl/"
  exit 1
}
GO_VER="$(go version | awk '{print $3}' | sed 's/^go//')"
echo -e "${GREEN}[OK]${NC}   Go ${GO_VER} detected."

# ─── [2/6] Prerequisite: PostgreSQL ──────────────────────────────────────────
echo -e "${GREY}[2/6]${NC} Checking PostgreSQL availability..."
if command -v psql > /dev/null 2>&1; then
  PG_VER="$(psql --version | awk '{print $3}')"
  echo -e "${GREEN}[OK]${NC}   PostgreSQL ${PG_VER} detected."
else
  echo -e "${YELLOW}[WARN]${NC} psql not found in PATH. Ensure PostgreSQL is installed and running."
  echo -e "${YELLOW}[WARN]${NC} GoClaw requires a running PostgreSQL instance. Set DATABASE_URL in .env."
fi

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

# ─── [4/6] Build ──────────────────────────────────────────────────────────────
if [ "${SKIP_BUILD}" -eq 0 ]; then
  echo -e "${GREY}[4/6]${NC} Building GoClaw binary..."
  cd "${PROJECT_DIR}"
  go build -o goclaw .
  echo -e "${GREEN}[OK]${NC}   Binary built: goclaw"
else
  echo -e "${GREY}[4/6]${NC} Skipping build. Run without --skip-build for full build."
fi

# ─── [5/6] Dependency Update ──────────────────────────────────────────────────
cd "${PROJECT_DIR}"
if [ "${DO_UPDATE}" -eq 1 ]; then
  echo -e "${GREY}[5/6]${NC} Updating Go dependencies..."
  go get -u ./... || echo -e "${YELLOW}[WARN]${NC} go get -u failed. Continuing with existing versions."
  go mod tidy
  echo -e "${GREEN}[OK]${NC}   Dependencies updated."
else
  echo -e "${GREY}[5/6]${NC} Skipping dependency update. Use --update to pull latest."
fi

# ─── [6/6] Validation ─────────────────────────────────────────────────────────
if [ "${SKIP_TESTS}" -eq 0 ]; then
  echo -e "${GREY}[6/6]${NC} Running tests..."
  if go test ./...; then
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
echo -e "${BOLD}${GREEN}  GoClaw setup complete!${NC}"
echo -e "${GREY}  Next steps:${NC}"
echo -e "${GREY}    1. Edit ${NC}${PROJECT_DIR}/.env${GREY} — set DATABASE_URL, JWT_SECRET${NC}"
echo -e "${GREY}    2. Run: ${NC}./start_goclaw.sh"
echo -e "${GREY}    3. Run: ${NC}./start_goclaw.sh --doctor${GREY}   (validate DB connection)${NC}"
echo -e "${GREY}  ─────────────────────────────────────────────────────────────${NC}"
echo ""

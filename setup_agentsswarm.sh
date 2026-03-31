#!/usr/bin/env bash
set -e

DO_UPDATE=0
RESYNC_ENV=0
INSTALL_OPENCLAW=0
INSTALL_PROVIDER_CLIS=0
SKIP_TESTS=0

for arg in "$@"; do
  case "$arg" in
    --update) DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --install-openclaw) INSTALL_OPENCLAW=1 ;;
    --install-provider-clis) INSTALL_PROVIDER_CLIS=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_DIR="${ROOT_DIR}/agentsswarm"

if [ ! -d "${BRIDGE_DIR}" ]; then
  echo "[ERROR] agentsswarm directory not found."
  exit 1
fi

echo "[1/6] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js is not installed or not in PATH."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm is not installed or not in PATH."; exit 1; }
NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d'.' -f1)"
if [ "${NODE_MAJOR}" -lt 22 ]; then
  echo "[ERROR] Node.js v22+ is required. Detected: v${NODE_MAJOR}."
  exit 1
fi

echo "[2/6] Using AgentSwarm-only setup flow."

cd "${BRIDGE_DIR}"

echo "[3/6] Synchronizing environment..."
if [ "${RESYNC_ENV}" -eq 1 ]; then
  node "scripts/bootstrap-env.mjs" --resync-env
else
  node "scripts/bootstrap-env.mjs"
fi

echo "[4/6] Installing local dependencies..."
npm install

if [ -f "ui/package.json" ]; then
  echo "[4/6] Installing UI dependencies..."
  npm --prefix "ui" install
fi

if [ "${DO_UPDATE}" -eq 1 ]; then
  echo "[5/6] Updating local dependencies..."
  npm update || echo "[WARN] npm update failed. Continuing with installed versions."
else
  echo "[5/6] Skipping dependency update. Use --update to enable."
fi

install_cli() {
  local label="$1"
  local package_cmd="$2"
  echo "[INFO] Installing ${label} ..."
  if ! eval "$package_cmd"; then
    echo "[WARN] ${label} install failed. Continue manually if needed."
  else
    echo "[OK] ${label} installed."
  fi
}

echo "[6/6] Installing optional CLIs..."
if [ "${INSTALL_OPENCLAW}" -eq 1 ]; then
  install_cli "OpenClaw CLI" "npm install -g openclaw@latest"
fi
if [ "${INSTALL_PROVIDER_CLIS}" -eq 1 ]; then
  install_cli "Codex CLI" "npm install -g @openai/codex"
  install_cli "Claude Code" "npm install -g @anthropic-ai/claude-code"
  install_cli "Gemini CLI" "npm install -g @google/gemini-cli"
  install_cli "OpenCode CLI" "npm install -g opencode"
fi
if [ "${INSTALL_OPENCLAW}" -eq 0 ] && [ "${INSTALL_PROVIDER_CLIS}" -eq 0 ]; then
  echo "[INFO] Skipping CLI installation. Use --install-openclaw and/or --install-provider-clis."
fi

echo "[Checks] Running verification..."
npm run check
if [ "${SKIP_TESTS}" -eq 1 ]; then
  echo "[INFO] Skipping tests. Run ./setup_agentsswarm.sh without --skip-tests for full verification."
else
  npm test
fi

if ! npm run startup-check; then
  echo "[ERROR] Startup checks failed. Fix the blocking issues above before launch."
  exit 1
fi

if ! npm run preflight; then
  echo "[WARN] Preflight is not fully green yet. Complete the missing env or CLI steps shown above."
fi

echo "[OK] AgentSwarm setup completed."
echo "Next recommended commands:"
echo "- openclaw onboard --auth-choice openai-codex"
echo "- openclaw models auth login --provider openai-codex"
echo "- npm run cli -- providers"
echo "- npm run cli -- packs"
echo "- ./start_agentsswarm.sh --doctor"

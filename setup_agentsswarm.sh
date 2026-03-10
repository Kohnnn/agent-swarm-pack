#!/usr/bin/env bash
set -e

DO_UPDATE=0
RESYNC_ENV=0
INSTALL_OPENCLAW=0
INSTALL_PROVIDER_CLIS=0
WITH_SWARMCLAW=0
SKIP_TESTS=0

for arg in "$@"; do
  case "$arg" in
    --update) DO_UPDATE=1 ;;
    --resync-env) RESYNC_ENV=1 ;;
    --install-openclaw) INSTALL_OPENCLAW=1 ;;
    --install-provider-clis) INSTALL_PROVIDER_CLIS=1 ;;
    --with-swarmclaw) WITH_SWARMCLAW=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_DIR="${ROOT_DIR}/agentsswarm"

if [ ! -d "${BRIDGE_DIR}" ]; then
  echo "[ERROR] agentsswarm directory not found."
  exit 1
fi

echo "[1/7] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js is not installed or not in PATH."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] npm is not installed or not in PATH."; exit 1; }
NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d'.' -f1)"
if [ "${NODE_MAJOR}" -lt 22 ]; then
  echo "[ERROR] Node.js v22+ is required. Detected: v${NODE_MAJOR}."
  exit 1
fi

if [ "${WITH_SWARMCLAW}" -eq 1 ]; then
  command -v git >/dev/null 2>&1 || { echo "[ERROR] Git is required for --with-swarmclaw."; exit 1; }
  echo "[2/7] Preparing SwarmClaw..."
  if [ "${DO_UPDATE}" -eq 1 ]; then
    "${ROOT_DIR}/setup_swarmclaw.sh" --update
  else
    "${ROOT_DIR}/setup_swarmclaw.sh"
  fi
else
  echo "[2/7] Skipping SwarmClaw setup. Use --with-swarmclaw to enable."
fi

cd "${BRIDGE_DIR}"

echo "[3/7] Synchronizing environment..."
if [ "${RESYNC_ENV}" -eq 1 ]; then
  node "scripts/bootstrap-env.mjs" --resync-env
else
  node "scripts/bootstrap-env.mjs"
fi

echo "[4/7] Installing local dependencies..."
npm install

if [ "${DO_UPDATE}" -eq 1 ]; then
  echo "[5/7] Updating local dependencies..."
  npm update || echo "[WARN] npm update failed. Continuing with installed versions."
else
  echo "[5/7] Skipping dependency update. Use --update to enable."
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

echo "[6/7] Installing optional CLIs..."
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

echo "[7/7] Running checks..."
npm run check
if [ "${SKIP_TESTS}" -eq 1 ]; then
  echo "[INFO] Skipping tests. Run ./setup_agentsswarm.sh without --skip-tests for full verification."
else
  npm test
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

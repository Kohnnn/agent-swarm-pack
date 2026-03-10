# ⚙️ OpenClaw Detailed Setup Guide

This guide is updated for the current OpenClaw docs structure (`docs.openclaw.ai/providers` and `docs.openclaw.ai/channels`) and focuses on practical setup for models + messaging.

---

## 🧭 Step 0: Install and Onboard

Run on your OpenClaw host machine:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

This sets up the Gateway service, workspace, and base auth flow.

---

## 🧠 Step 1: Connect Your Model Provider

OpenClaw supports many providers, but these five paths are the most common.

### Option A: Anthropic (Claude)

```bash
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Example default model:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6"
      }
    }
  }
}
```

### Option B: OpenAI (API key)

```bash
openclaw onboard --auth-choice openai-api-key
# or
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

Example default model:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-5.1-codex"
      }
    }
  }
}
```

### Option C: OpenAI Codex subscription transport

```bash
openclaw onboard --auth-choice openai-codex
```

Example model ref:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai-codex/gpt-5.3-codex"
      }
    }
  }
}
```

### Option D: OpenRouter (multi-model gateway)

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

Example model ref:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/anthropic/claude-sonnet-4-5"
      }
    }
  }
}
```

### Option E: Local Ollama (self-hosted)

```bash
ollama pull gpt-oss:20b
```

```env
OLLAMA_API_KEY="ollama-local"
```

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama/gpt-oss:20b"
      }
    }
  }
}
```

Notes:

- Current OpenClaw Ollama docs use native Ollama API (`/api/chat`) and auto-discovery when `OLLAMA_API_KEY` is set.
- If you define `models.providers.ollama` explicitly, you must manage model entries manually.

---

## 💬 Step 2: Connect Messaging Apps

Current docs list 20+ channels. Most teams start with one of these:

- **Telegram**: fastest setup for many users.
- **Discord**: strong for multi-channel team workflows.
- **Slack**: good for workspace-native ops.
- **WhatsApp**: strong personal usage; requires QR pairing.

### Telegram quick setup

1. Create bot via `@BotFather`.
2. Put token in config/env.

```env
TELEGRAM_BOT_TOKEN="123456789:ABCDEF..."
```

### Discord quick setup

1. Create app + bot in Discord Developer Portal.
2. Enable intents as required by your workflow.
3. Add token in config/env.

```env
DISCORD_BOT_TOKEN="your_discord_bot_token"
```

### Slack quick setup

1. Create Slack app and install to workspace.
2. Add bot token scopes (`chat:write`, `app_mentions:read`, etc. per need).

```env
SLACK_BOT_TOKEN="xoxb-..."
```

### WhatsApp quick setup

1. Start gateway/channel login flow.
2. Scan QR on first pair.
3. Keep host persistent to maintain session state.

For all channel-specific fields and policy options, use official docs:

- [Channels hub](https://docs.openclaw.ai/channels)
- [Telegram channel setup](https://docs.openclaw.ai/channels/telegram)
- [Discord channel setup](https://docs.openclaw.ai/channels/discord)
- [Slack channel setup](https://docs.openclaw.ai/channels/slack)
- [WhatsApp channel setup](https://docs.openclaw.ai/channels/whatsapp)

---

## ✅ Step 3: Validate the Setup

```bash
openclaw models list
openclaw channels status --probe
openclaw gateway status
```

Smoke-test one turn:

```bash
openclaw agent --agent main --message "Reply with: setup-check-ok"
```

---

## 🔀 Step 4: Next Steps (Move to Multi-Agent)

After your single-agent setup is healthy, you have three paths to scale up:

1. **The AgentSwarm App (Recommended):** Proceed to [`agentsswarm/README.md`](agentsswarm/README.md) to launch the compact local runtime with hybrid execution, compact packs, and chat relay.
2. **The Manual Swarm:** Follow [`MULTI_AGENT_SETUP.md`](MULTI_AGENT_SETUP.md) for a step-by-step guide on creating and routing multiple agents in your terminal.
3. **The Control-Plane Dashboard:** Use [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md) for a multi-provider and multi-gateway orchestration panel, then use [`SWARMCLAW_GUIDANCE.md`](SWARMCLAW_GUIDANCE.md) for combined architecture decisions.

---

## 📌 Source Links

- Provider hub: [docs.openclaw.ai/providers](https://docs.openclaw.ai/providers)
- OpenAI provider: [docs.openclaw.ai/providers/openai](https://docs.openclaw.ai/providers/openai)
- Anthropic provider: [docs.openclaw.ai/providers/anthropic](https://docs.openclaw.ai/providers/anthropic)
- OpenRouter provider: [docs.openclaw.ai/providers/openrouter](https://docs.openclaw.ai/providers/openrouter)
- Ollama provider: [docs.openclaw.ai/providers/ollama](https://docs.openclaw.ai/providers/ollama)
- Channels hub: [docs.openclaw.ai/channels](https://docs.openclaw.ai/channels)

<div align="center">

# 🤖 AgentsSwarm: OpenClaw Multi-Agent Orchestration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![OpenClaw](https://img.shields.io/badge/Powered%20By-OpenClaw-blue.svg)](https://github.com/SamurAIGPT/awesome-openclaw)

**The practical playbook for building a compact OpenClaw AgentSwarm. Start with the local `agentsswarm/` app, connect Discord/Telegram/WhatsApp, add multi-provider execution, and optionally layer on SwarmClaw for control-plane operations.**

</div>

---

## 📖 Table of Contents

- [March 2026 Refresh](#-march-2026-refresh)
- [What This Repo Is](#-what-this-repo-is)
- [Quick Start (AgentSwarm App)](#-quick-start-agentswarm-app)
- [AgentSwarm App](#-agentswarm-app)
- [SwarmClaw Companion Dashboard](#-swarmclaw-companion-dashboard)
- [Architecture: Agent Progression](#-architecture-agent-progression)
- [Models: Latest Provider Snapshot](#-models-latest-provider-snapshot)
- [Messaging Apps: Latest Channel Snapshot](#-messaging-apps-latest-channel-snapshot)
- [Multi-Agent Setup Guides](#multi-agent-setup-guides)
- [Use Cases](#-use-cases)
- [Brainstorm: How to Evolve This Repo](#-brainstorm-how-to-evolve-this-repo)
- [Sources](#-sources)
- [Credits](#-credits)

---

## 🆕 March 2026 Refresh

- **OpenClaw package/version:** `openclaw@2026.2.26` on npm.
- **Provider docs updated:** current provider hub is `docs.openclaw.ai/providers`.
- **Current model examples in docs:** `anthropic/claude-opus-4-6`, `openai/gpt-5.1-codex`, `openai-codex/gpt-5.3-codex`, `openrouter/anthropic/claude-sonnet-4-5`, `ollama/gpt-oss:20b`.
- **Messaging docs now list 20+ channels**, including WhatsApp, Telegram, Discord, Slack, Signal, Teams, Matrix, Zalo, and more.
- **Deployment guide rewritten for multi-agent** using current `openclaw agents`, bindings, and sub-agent patterns.
- **Use cases updated** with newer community patterns from `awesome-openclaw-usecases` (including multi-agent specialized team and custom morning brief).
- **AgentSwarm app finalized** in `agentsswarm/` as the primary local runtime for chat-first orchestration.
- **Root setup/start scripts now center on AgentSwarm** with env sync, optional CLI installs, preflight checks, and compact hybrid defaults.
- **Compact packs now default to under 8 agents**, with `software-6`, `ops-5`, `research-5`, and `support-5` built in.
- **Multi-provider + multi-Copilot profiles** are exposed directly from the AgentSwarm CLI and runtime.
- **SwarmClaw remains available as an optional companion** for control-plane operations and gateway management.

---

## ✅ What This Repo Is

This repository is a practical set of **docs, launchers, diagrams, and integration templates** for modern OpenClaw multi-agent deployment, centered on the local AgentSwarm app:

- [`agentsswarm/README.md`](agentsswarm/README.md): the primary compact app for `$`/`#` command routing, chat relay, compact packs, and provider profiles.
- [`OPENCLAW_SETUP.md`](OPENCLAW_SETUP.md): current model and messaging setup (Discord, Telegram).
- [`MULTI_AGENT_SETUP.md`](MULTI_AGENT_SETUP.md): initial multi-agent workspace generation and routing.
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md): advanced multi-agent operations and team topologies.
- [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md): install and configure SwarmClaw as the optional operations/control-plane dashboard.
- [`SWARMCLAW_GUIDANCE.md`](SWARMCLAW_GUIDANCE.md): decide when to stay with AgentSwarm only and when to add SwarmClaw.
- [`USECASES.md`](USECASES.md): curated real-world use-case ideas (automated trading, research, content).
- [`templates/claw-empire-integration/`](templates/claw-empire-integration/): legacy visual office reference material and the older FTS office pack overrides.

Use `agentsswarm/` as the main runtime, OpenClaw as the execution backbone, and SwarmClaw only when you need dashboard-style gateway and connector operations.

---

## 🚀 Quick Start (AgentSwarm App)

On the machine where OpenClaw runs:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Then set up AgentSwarm from this repo root:

Windows:

```powershell
.\setup_agentsswarm.bat --install-openclaw --install-provider-clis
.\start_agentsswarm.bat --doctor
```

macOS/Linux:

```bash
./setup_agentsswarm.sh --install-openclaw --install-provider-clis
./start_agentsswarm.sh --doctor
```

Recommended follow-up order:

1. [`agentsswarm/README.md`](agentsswarm/README.md) for the runtime, CLI, compact packs, and channel contract.
2. [`OPENCLAW_SETUP.md`](OPENCLAW_SETUP.md) for providers and base messaging auth.
3. [`MULTI_AGENT_SETUP.md`](MULTI_AGENT_SETUP.md) for isolated agents and bindings.
4. [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for routing, sub-agents, and ops.
5. [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md) only if you want a dashboard/control-plane companion.
6. [`USECASES.md`](USECASES.md) to pick a workflow blueprint.

---

## 🤖 AgentSwarm App

`agentsswarm/` is now the primary app in this repository. It is optimized for:

- seamless Discord / Telegram / WhatsApp chat routing
- compact hybrid execution (`#` creates a lightweight board task and runs immediately)
- provider profiles and multi-Copilot usage
- compact packs that stay under 8 agents
- CLI-first operations instead of a heavy visual layer

Root setup and start wrappers:

**Windows PowerShell:**

```powershell
.\setup_agentsswarm.bat
.\start_agentsswarm.bat
```

**macOS / Linux:**

```bash
./setup_agentsswarm.sh
./start_agentsswarm.sh
```

Built-in compact packs:

- `software-6`: software delivery
- `ops-5`: infra and automation
- `research-5`: synthesis and analysis
- `support-5`: multi-channel support

**Custom pack templates** for specialized workflows are available in [`templates/samples/`](templates/samples/README.md) and can be deployed alongside or instead of the built-in packs:

| Pack | Use Case | Agents |
|------|----------|--------|
| `dev-ops-corp` | Coding & release workflows | 9 |
| `research_report` | Research → fact-check → polished report | 6 |
| `review_desk` | Multi-specialist review with verdicts | 6 |
| `financial_analyst` | Market analysis → risk assessment → briefing | 6 |
| `second_brain` | Personal knowledge capture & retrieval | 7 |

See [`templates/samples/README.md`](templates/samples/README.md) for the full pack library, agent rosters, and deployment commands.

Built-in default provider profile set:

- `codex-main`
- `copilot-review`
- `claude-cli`
- `gemini-cli`
- `opencode-cli`
- `openrouter-fallback`

See [`agentsswarm/README.md`](agentsswarm/README.md) for full runtime details, commands, and the normalized chat payload contract.

Legacy note: the old visual office reference still exists in [`CLAW_EMPIRE_SETUP.md`](CLAW_EMPIRE_SETUP.md), but it is no longer the primary path for this repo.

---

## 📡 SwarmClaw Companion Dashboard

[SwarmClaw](https://github.com/swarmclawai/swarmclaw) is the optional companion control plane. Add it when you need:

- OpenClaw gateway profiles
- connector inventory and routing visibility
- multi-provider control plane management
- task board / scheduler style operations

Install with our wrappers:

**Windows PowerShell:**

```powershell
.\setup_swarmclaw.bat
```

**macOS / Linux:**

```bash
./setup_swarmclaw.sh
```

Start it with:

**Windows:** `.\start_swarmclaw.bat`
**macOS/Linux:** `./start_swarmclaw.sh`

Then open `http://127.0.0.1:3456` and complete first-run access key onboarding.

Use docs:

- [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md)
- [`SWARMCLAW_GUIDANCE.md`](SWARMCLAW_GUIDANCE.md)

---

## 🧠 Architecture: Agent Progression

This flow tracks the progression highlighted in Misbah Syed's architecture thread.

**1. The Atom (LLM + tool calls)**

<p align="center">
  <img src="images/misbah-step-atom.jpg" alt="Agent atom stage" width="760"/>
</p>

**2. Messaging adapters (Telegram/Discord/WhatsApp/etc.)**

<p align="center">
  <img src="images/misbah-step-messaging.jpg" alt="Messaging adapter stage" width="760"/>
</p>

**3. Agent loop (reason -> act -> observe -> repeat)**

<p align="center">
  <img src="images/misbah-step-loop.jpg" alt="Agent loop stage" width="760"/>
</p>

**4. Memory + skills layer**

<p align="center">
  <img src="images/misbah-step-memory-skills.jpg" alt="Memory and skills stage" width="760"/>
</p>

**5. Gateway-centered orchestration**

<p align="center">
  <img src="images/misbah-openclaw-architecture.jpg" alt="OpenClaw architecture" width="900"/>
</p>

**6. Real-world orchestrator outcomes (solo founder setup)**

<p align="center">
  <img src="images/elvissun-orchestration-flow.jpg" alt="Orchestration workflow" width="700"/>
</p>

**7. Claw ecosystem landscape snapshot**

<p align="center">
  <img src="images/misbah-claw-landscape.jpg" alt="Claw ecosystem landscape" width="760"/>
</p>

---

## 🧩 Models: Latest Provider Snapshot

OpenClaw now documents providers under `docs.openclaw.ai/providers`.

### Common 2026 model refs

- `anthropic/claude-opus-4-6`
- `openai/gpt-5.1-codex`
- `openai-codex/gpt-5.3-codex` (Codex subscription auth path)
- `openrouter/anthropic/claude-sonnet-4-6`
- `ollama/gpt-oss:120b`

### Example default model config

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": [
          "openai/gpt-5.1-codex",
          "openrouter/anthropic/claude-sonnet-4-5"
        ]
      }
    }
  }
}
```

### Local model path (Ollama)

```bash
ollama pull gpt-oss:20b
```

```env
OLLAMA_API_KEY="ollama-local"
```

---

## 🏗️ The Claw Ecosystem (Comparison)

Different tasks require different foundational constraints. The open-source
ecosystem provides varied framework backends tailored to your deployment
strategy.

<p align="center">
  <img src="images/comparediffrentclaw.jpg" alt="Compare Different Claws" width="700"/>
</p>

Depending on your need for speed, memory constraint, or language preference,
you can dynamically swap the underlying agent architectures:

### 1. NanoClaw

- **Language:** TypeScript
- **Optimal For:** Ultra-lightweight deployment, single channel messaging.
- **Core Specs:** ~500 lines of code, very low memory consumption.
NanoClaw is the entry point for minimalistic deployments.
<p align="center">
  <a href="https://github.com/qwibitai/nanoclaw"><img src="images/nanoclaw.jpg" alt="NanoClaw" width="500"/></a>
</p>

### 2. Nanobot

- **Language:** Python
- **Optimal For:** Learning, research environments, and quick prototyping.
- **Core Specs:** ~4,000 lines of code, ~0.8s startup, ~100MB memory.
Nanobot is a lean, hackable orchestration layer.
<p align="center">
  <a href="https://github.com/HKUDS/nanobot"><img src="images/nanobot.jpg" alt="Nanobot" width="500"/></a>
</p>

### 3. PicoClaw

- **Language:** Go
- **Optimal For:** Edge devices and IoT workloads.
- **Core Specs:** ~41,000 lines of code, <1s startup, <10MB memory footprint.
<p align="center">
  <a href="https://github.com/sipeed/picoclaw"><img src="images/picoclaw.jpg" alt="PicoClaw" width="500"/></a>
</p>

### 4. IronClaw

- **Language:** Rust
- **Optimal For:** High security, zero-trust deployments.
- **Core Specs:** ~128,000 lines, <10ms startup, ~7.8MB memory, WASM + Docker.
<p align="center">
  <a href="https://github.com/nearai/ironclaw"><img src="images/ironclaw.jpg" alt="IronClaw" width="400"/></a>
  <img src="images/irronclaw2.jpg" alt="IronClaw Architecture" width="400"/>
</p>

### 5. ZeroClaw

- **Language:** Rust
- **Optimal For:** Maximum flexibility and enterprise backend routing.
- **Core Specs:** ~144,000 lines, <10ms startup, <5MB memory footprint.
<p align="center">
  <a href="https://github.com/zeroclaw-labs/zeroclaw"><img src="images/zeroclaw.jpg" alt="ZeroClaw" width="500"/></a>
</p>

### 6. OpenClaw (The Monolith)

- **Language:** TypeScript
- **Optimal For:** Orchestrating other agents at scale.
- **Core Specs:** ~400,000+ lines, SQL + Markdown hybrid memory, 11+ channels.
<p align="center">
  <a href="https://github.com/openclaw/openclaw"><img src="images/openclaw.jpg" alt="OpenClaw" width="500"/></a>
</p>

### Comprehensive Comparison Matrix

<p align="center">
  <img src="images/detailtablecomparrisonallclaw.png" alt="Detailed Table Comparison" width="800"/>
</p>

---

## 💬 Messaging Apps: Latest Channel Snapshot

From current OpenClaw channel docs, notable supported channels include:

- **Core popular channels:** WhatsApp, Telegram, Discord, Slack, Signal.
- **Also available:** IRC, Google Chat, Mattermost, Microsoft Teams, Feishu, LINE, Matrix, Nextcloud Talk, iMessage (legacy), BlueBubbles, Twitch, Zalo, Synology Chat, Nostr, Tlon.
- **Plugin-installed channels** are explicitly marked in docs (for example Teams/Mattermost/LINE/Matrix/Twitch/Zalo variants).

Operational note: fastest setup is usually Telegram; WhatsApp needs QR pairing and persistent session state.

---

## Multi-Agent Setup Guides

- **Primary runtime app:** [agentsswarm/README.md](agentsswarm/README.md)
- **Initial setup + channels:** [OPENCLAW_SETUP.md](OPENCLAW_SETUP.md)
- **Main step-by-step:** [MULTI_AGENT_SETUP.md](MULTI_AGENT_SETUP.md)
- **Deployment guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **SwarmClaw control plane:** [SWARMCLAW_SETUP.md](SWARMCLAW_SETUP.md)
- **Platform decision guide:** [SWARMCLAW_GUIDANCE.md](SWARMCLAW_GUIDANCE.md)
- **Legacy visual office reference:** [CLAW_EMPIRE_SETUP.md](CLAW_EMPIRE_SETUP.md)
- **Legacy FTS pack details:** [templates/claw-empire-integration/FTS_USE_CASE.md](templates/claw-empire-integration/FTS_USE_CASE.md)
- **Explore Use Cases:** [USECASES.md](USECASES.md)
- **Team pattern reference:** [Multi-Agent Specialized Team](https://github.com/hesamsheikh/awesome-openclaw-usecases/blob/main/usecases/multi-agent-team.md)
- **Content pipeline reference:** [Multi-Agent Content Factory](https://github.com/hesamsheikh/awesome-openclaw-usecases/blob/main/usecases/content-factory.md)

---

## 💡 Use Cases

Explore updated patterns in [`USECASES.md`](USECASES.md), including:

- Multi-Agent Specialized Team (strategy + dev + marketing + business)
- Multi-Channel Personal Assistant
- Family Calendar & Household Assistant
- Custom Morning Brief
- Semantic Memory Search
- Event Guest Confirmation

---

## 🧪 Brainstorm: How to Evolve This Repo

1. **Add a copy-paste config cookbook**
   Create per-channel and per-agent `openclaw.json` templates (single-agent, founder-team, content-factory, support-desk).

2. **Add a security-hardening guide**
   Document minimal tool profiles, channel allowlists, and isolated sandbox recommendations before production deployment.

3. **Add an operations runbook**
   Cover `openclaw health`, `openclaw channels status --probe`, restart paths, and incident recovery checklists.

4. **Add a benchmark matrix**
   Track model quality/cost/latency by task class (coding, research, customer support).

5. **Add visual architecture pages**
   Turn the image set into dedicated explainers: base loop, multi-agent routing, and orchestrator + reviewer pipelines.

6. **Add a “recipes from the community” section**
   Continuously ingest standout workflows from curated GitHub lists and maintain date-stamped updates.

---

## 🔗 Sources

- OpenClaw official docs: [docs.openclaw.ai](https://docs.openclaw.ai/)
- Providers hub: [docs.openclaw.ai/providers](https://docs.openclaw.ai/providers)
- Channels hub: [docs.openclaw.ai/channels](https://docs.openclaw.ai/channels)
- Multi-agent concepts: [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent)
- Sub-agents docs: [docs.openclaw.ai/tools/subagents](https://docs.openclaw.ai/tools/subagents)
- Awesome OpenClaw guide: [SamurAIGPT/awesome-openclaw](https://github.com/SamurAIGPT/awesome-openclaw)
- Awesome OpenClaw use cases: [hesamsheikh/awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- Misbah Syed architecture thread: [x.com/MisbahSy/status/2025570052108665231](https://x.com/MisbahSy/status/2025570052108665231)
- Elvis Sun orchestrator article: [x.com/elvissun/article/2025920521871716562](https://x.com/elvissun/article/2025920521871716562)
- JXiaoLoong article: [x.com/JXiaoLoong/status/2024376180707905816](https://x.com/JXiaoLoong/status/2024376180707905816)
- 123olp workflow prompt post: [x.com/123olp/status/2025704271921213731](https://x.com/123olp/status/2025704271921213731)

---

## 🙌 Credits

- **@MisbahSy** for architecture progression visuals and framework tradeoff framing.
- **@elvissun** for practical orchestration + CI/CD execution patterns.
- **@hesamsheikh** for maintaining community use-case curation.
- **@SamurAIGPT** for curated ecosystem resources.

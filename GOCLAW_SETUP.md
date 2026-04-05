# GoClaw Setup Guide

[GoClaw](https://github.com/nextlevelbuilder/goclaw) is a **multi-tenant AI agent gateway** written in Go. It connects LLMs to your tools, channels, and data — with built-in agent teams, skills, heartbeat, cron, and 20+ LLM providers. Single binary, no Node.js, <1s startup.

Full documentation at [docs.goclaw.sh](https://docs.goclaw.sh).

---

## Prerequisites

| Requirement | Version | Check Command |
|------------|---------|--------------|
| Go | **1.26+** | `go version` |
| Docker | **Recent** | `docker --version` |
| PostgreSQL | **15+ with pgvector** | (provided via Docker) |
| git | Any | `git --version` |

> **Note:** Docker is the recommended path for PostgreSQL + pgvector. You can also run PostgreSQL directly or use a managed Postgres instance (Neon, Supabase, etc.).

---

## Installation

### Option A: GoClaw Lite (Desktop — No Docker)

The fastest path to a running GoClaw agent on your local machine. Ships with SQLite (no PostgreSQL needed), chat UI, agent management, team tasks, cron, and MCP servers.

**macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/nextlevelbuilder/goclaw/main/scripts/install-lite.sh | bash
```

**Windows PowerShell:**
```powershell
irm https://raw.githubusercontent.com/nextlevelbuilder/goclaw/main/scripts/install-lite.ps1 | iex
```

**What you get with Lite:**
- Single native app (Wails v2 + React), ~30 MB
- SQLite database (zero setup)
- Chat with agents (streaming, tools, media, file attachments)
- Agent management (max 5), provider config, MCP servers, cron
- Team tasks with Kanban board and real-time updates
- Auto-update from GitHub Releases

**Lite limits:** 5 agents max, 1 team, no channels (Telegram/Discord/etc.), no pgvector semantic search.

---

### Option B: Full Gateway (Docker — Recommended for Teams)

GoClaw with PostgreSQL + pgvector for full multi-agent, multi-team, multi-channel deployments.

**1. Clone the repo**

```bash
git clone -b main https://github.com/nextlevelbuilder/goclaw.git
cd goclaw
```

**2. Generate environment config**

```bash
chmod +x prepare-env.sh && ./prepare-env.sh
# This creates .env.local with auto-generated secrets
```

**3. Add your API keys**

Edit `.env.local`:
```env
# At least one provider is required
GOCLAW_ANTHROPIC_API_KEY=sk-ant-...
# or
GOCLAW_OPENROUTER_API_KEY=sk-or-...
# or
GOCLAW_OPENAI_API_KEY=sk-...
```

**4. Start the full stack**

```bash
make up
# Creates Docker network, builds, migrates DB, starts all services
```

**5. Open the dashboard**

```
http://localhost:18790
```

**Common make commands:**
```bash
make up          # Start all services (build + migrate)
make down        # Stop all services
make logs        # Tail logs
make reset       # Wipe volumes and rebuild from scratch
```

**Optional services:**
```bash
make up WITH_BROWSER=1   # Headless Chrome for browser automation
make up WITH_OTEL=1      # Jaeger tracing UI
make up WITH_SANDBOX=1    # Docker sandbox for untrusted code
make up WITH_TAILSCALE=1  # Tailscale private network exposure
```

**Docker image variants:**
| Image | Description |
|-------|-------------|
| `latest` | Backend + web UI + Python (recommended) |
| `latest-base` | Backend API-only, no web UI |
| `latest-full` | All runtimes + skill dependencies pre-installed |
| `latest-otel` | Latest + OpenTelemetry tracing |

---

### Option C: Bare Metal / Source

Build from source and run the binary directly (requires external PostgreSQL + pgvector).

```bash
git clone -b main https://github.com/nextlevelbuilder/goclaw.git
cd goclaw
go mod download
make build

# Set environment variables
export GOCLAW_DATABASE_URL="postgres://user:pass@host:5432/goclaw?sslmode=require"
export GOCLAW_ANTHROPIC_API_KEY=sk-ant-...

./goclaw onboard    # Interactive first-run wizard
./goclaw            # Start gateway on :18790
```

---

## Provider Configuration

GoClaw auto-detects providers from your env vars. At least one is required:

```env
# Anthropic (recommended — native HTTP+SSE + extended thinking + prompt caching)
GOCLAW_ANTHROPIC_API_KEY=sk-ant-...

# OpenAI / Azure
GOCLAW_OPENAI_API_KEY=sk-...
GOCLAW_AZURE_OPENAI_ENDPOINT=https://...

# OpenRouter (100+ models)
GOCLAW_OPENROUTER_API_KEY=sk-or-...

# Others: GROQ_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY, OLLAMA_API_KEY, etc.
```

Provider defaults per agent role:
- **Lead agents** → high-reasoning model (e.g., `anthropic/claude-opus-4`)
- **Specialist members** → balanced cost/performance (e.g., `openai/gpt-4o`)
- **Review/QA agents** → reliable model with strict quality output

Configure per-agent via dashboard or CLI:
```bash
./goclaw agents update research_lead --provider anthropic --model claude-opus-4-6
./goclaw agents update crawler_specialist --provider openrouter --model openai/gpt-4o
```

---

## Channel Setup

### Telegram

```bash
./goclaw channels add telegram
# Bot token from @BotFather
```

### Discord

```bash
./goclaw channels add discord
# Requires: Bot token, Server ID, Channel ID
# Enable: Message Content Intent, Server Members Intent
```

### Slack

```bash
./goclaw channels add slack
# Requires: App Token, Bot Token, Workspace URL
```

### Feishu / Lark

```bash
./goclaw channels add feishu
```

### Zalo OA

```bash
./goclaw channels add zalo-oa
```

### WhatsApp (via WebSocket bridge)

GoClaw connects to a WhatsApp bridge service (e.g., `whatsapp-web.js`):

```bash
./goclaw channels add whatsapp --bridge-url ws://localhost:9090
```

### Channel Binding

Bind a channel to an agent:

```bash
./goclaw agents bind --agent research_lead --channel telegram --chat-id YOUR_CHAT_ID
./goclaw agents bind --agent finance_lead --channel discord --channel-id 123456789
```

---

## Creating Agents

### Single Agent

```bash
./goclaw agents add --name "assistant" --provider anthropic
```

### From Context Files

Inject the standard 4-file context file set:

```bash
# Create agent
./goclaw agents add --name research_lead --provider anthropic

# Inject context files from a pack template
./goclaw agents update research_lead --context-files templates/samples/research_report/research_lead/
```

The `--context-files` flag uploads all `.md` files in the directory as context for that agent:
- `SOUL.md` → persona and tone
- `IDENTITY.md` → name, emoji, avatar
- `AGENTS.md` → workspace conventions (integrated into system prompt)
- `TOOLS.md` → role-specific tool notes
- `USER.md` → human profile

### Listing Agents

```bash
./goclaw agents list
./goclaw agents list --format json
./goclaw agents get research_lead
```

---

## Agent Teams (Pack Deployment)

The core GoClaw feature for agent packs. A team = 1 lead + up to 5 members with a shared task board and mailbox.

### Create a Team

```bash
./goclaw teams create \
  --name "research-report" \
  --lead research_lead
```

### Add Members

```bash
./goclaw teams add research-report \
  --agents crawler_specialist fact_check_lead data_analyst technical_writer summary_editor
```

### Inject Context Files per Agent

```bash
./goclaw agents update research_lead \
  --context-files templates/samples/research_report/research_lead/
./goclaw agents update crawler_specialist \
  --context-files templates/samples/research_report/crawler_specialist/
./goclaw agents update fact_check_lead \
  --context-files templates/samples/research_report/fact_check_lead/
./goclaw agents update data_analyst \
  --context-files templates/samples/research_report/data_analyst/
./goclaw agents update technical_writer \
  --context-files templates/samples/research_report/technical_writer/
./goclaw agents update summary_editor \
  --context-files templates/samples/research_report/summary_editor/
```

### Configure Team Task Board

The lead agent creates tasks on the shared board. Members claim and complete them.

Enable task board for the team lead:
```bash
./goclaw agents update research_lead --tools team_tasks,spawn,cron,memory_search
```

Enable task board access for all members:
```bash
./goclaw agents update crawler_specialist --tools team_tasks
./goclaw agents update fact_check_lead --tools team_tasks
# ... etc
```

---

## Skills System

Skills package reusable knowledge into `SKILL.md` files — searchable and injectable per-agent.

### Adding a Skill

```bash
# Copy skill to goclaw's skills store
cp -r my-skill/ ~/.goclaw/skills-store/my-skill/

# Or install from the skill store
./goclaw skills add my-skill
```

### Attaching Skills to an Agent

```bash
./goclaw agents update research_lead --skills research-methodology,web-search,fact-check
```

### Creating a Pack-Specific Skill

Create `skkills/research-methodology/SKILL.md`:

```markdown
---
name: research-methodology
description: Structured research and fact-checking methodology
version: 1.0
---

# Research Methodology

## Source Quality Tiers

| Tier | Source | Trust |
|------|-------|-------|
| 1 | Peer-reviewed, official databases | High |
| 2 | Established news, industry reports | Medium-High |
| 3 | Blogs, white papers, press releases | Medium |
| 4 | Forums, social media, unverified | Low |

## Claim Confidence Levels

- **VERIFIED** — 2+ independent sources confirm
- **UNVERIFIED** — No confirmation, no contradiction
- **DISPUTED** — Sources conflict
- **FALSE** — Primary source evidence contradicts claim
```

---

## Heartbeat System

GoClaw agents can perform proactive periodic check-ins — useful for monitoring queues, dashboards, or external systems.

### Configure Heartbeat

```bash
./goclaw agents update research_lead \
  --heartbeat-interval 30m \
  --heartbeat-message "Check research queue status, team task board, pending fact-checks."
```

Or via dashboard at `http://localhost:18790` → Agents → select agent → Heartbeat.

### Heartbeat vs Cron

| | Heartbeat | Cron |
|-|-----------|------|
| Use when | Batching multiple checks together | Exact timing matters |
| Context | Conversational context available | Isolated from main session |
| Trigger | Periodic (every N minutes) | One-shot or cron expression |
| Output | Delivered to channel | Delivered to channel |

---

## Cron Scheduling

Schedule agent tasks to run automatically:

```bash
./goclaw cron create \
  --agent research_lead \
  --name "daily-brief" \
  --schedule "0 9 * * 1-5" \
  --message "Morning research queue status, team assignments, pending fact-checks."

./goclaw cron create \
  --agent crawler_specialist \
  --name "nightly-scan" \
  --schedule "0 2 * * *" \
  --message "Run full web scan. Report findings to #research-findings."

./goclaw cron list
./goclaw cron delete daily-brief
```

---

## Memory System

GoClaw has two memory systems:

### 1. File-Based Memory (daily notes)

Agents maintain `memory/YYYY-MM-DD.md` files — raw session logs, decisions, context. These are auto-created and read each session.

### 2. Hybrid Search Memory (FTS + pgvector)

For semantic retrieval of long-term facts, preferences, and knowledge:

```bash
# Search memory
./goclaw memory search research_lead "VNM valuation history"
./goclaw memory get research_lead <memory_id>
```

Agents access this via the `memory_search` and `memory_get` tools automatically.

### Knowledge Graph

LLM-powered extraction of entities and relationships from conversations:

```bash
./goclaw agents update research_lead --tools knowledge_graph_search
```

---

## Multi-Tenant Setup

GoClaw supports multi-user workspaces out of the box:

```bash
# Create a new user workspace
./goclaw users create --name "alice" --email "alice@example.com"

# Create agents for that user
./goclaw agents add --name "alice-assistant" --provider anthropic --user alice

# Set per-user context
./goclaw agents update alice-assistant --context-files /path/to/alice-user-context/
```

Channel bindings, agent permissions, and API keys are all isolated per user.

---

## Security Hardening

GoClaw ships with 5 security layers:

1. **Transport** — TLS enforcement, CORS control
2. **Input** — Prompt injection detection, SSRF protection, path traversal prevention
3. **Tools** — Shell deny patterns, exec approval workflow
4. **Output** — Content filtering
5. **Isolation** — Docker sandbox for untrusted code

### Recommended Production Settings

```env
GOCLAW_RATE_LIMIT_PER_MINUTE=60
GOCLAW_ALLOWED_OUTBOUND_HOSTS=api.anthropic.com,api.openai.com
GOCLAW_EXEC_DENY_PATTERNS=rm -rf /,shutdown,powershell -enc
GOCLAW_EXEC_REQUIRE_APPROVAL=true
```

### API Keys & RBAC

```bash
# Create an API key for programmatic access
./goclaw api-keys create --name "cicd-bot" --role operator

# Roles: admin, operator, viewer
```

---

## Updating

### Docker
```bash
docker compose pull && docker compose up -d
```

### Binary
```bash
./goclaw update --apply
# Downloads, verifies SHA256, swaps binary, restarts
```

### Web Dashboard
Open **About** dialog → click **Update Now** (admin only).

---

## Troubleshooting

```bash
# Health check
curl http://localhost:18790/health

# Logs
make logs
docker compose logs -f goclaw

# DB migrations status
./goclaw migrate status

# Test an agent
./goclaw agents chat research_lead --message "Hello"

# List all channels and their status
./goclaw channels list
```

Full troubleshooting: [docs.goclaw.sh/#troubleshooting](https://docs.goclaw.sh/#troubleshooting)

---

## Next Steps

1. **[GOCLAW_PACKS.md](GOCLAW_PACKS.md)** — Port your agent packs to GoClaw teams
2. **[docs.goclaw.sh/#teams-what-are-teams](https://docs.goclaw.sh/#teams-what-are-teams)** — Deep dive on agent teams
3. **[docs.goclaw.sh/#skills](https://docs.goclaw.sh/#skills)** — Build pack-specific skills
4. **[docs.goclaw.sh/#deployment](https://docs.goclaw.sh/#deployment)** — Production deployment guide

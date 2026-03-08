# Claw-Empire Setup Guide

[Claw-Empire](https://github.com/GreenSheep01201/claw-empire) is a **local-first AI agent office simulator** that transforms your OpenClaw agent swarm into a virtual software company. You are the CEO. Your agents are the employees. They collaborate across departments, hold meetings, deliver tasks, and level up — all visualized through a pixel-art office interface.

This guide walks you through installing, configuring, and wiring Claw-Empire to your existing Discord agent swarm step by step.

---

## 1. Prerequisites

Before starting, ensure the following are installed:

| Requirement | Version | Check Command |
|---|---|---|
| Node.js | **22+** | `node -v` |
| pnpm | Latest | `pnpm -v` |
| git | Any | `git --version` |

If pnpm is not installed, enable it via corepack:
```powershell
corepack enable
```

---

## 2. Installation

### Option A: One-Click Setup (Recommended)

Run the included **`setup_claw_empire.bat`** script (Windows) to handle the complete setup process automatically. 

The installer will:
- Clone or automatically pull the latest updates from the [Claw-Empire repository](https://github.com/GreenSheep01201/claw-empire)
- Initialize Git submodules
- Install all dependencies via pnpm
- Create `.env` from `.env.example`
- Generate a random `OAUTH_ENCRYPTION_SECRET`
- Auto-generate `INBOX_WEBHOOK_SECRET` if missing
- **Apply FTS: Fintech Startup source overrides** from `templates/claw-empire-integration/`
- **Rebuild the app** (`pnpm build`) with the custom pack included
- **Register all 9 FTS agents** into the SQLite database

> **Note:** The AGENTS.md orchestration rules are injected automatically on every dev server start via the `predev:local` hook — no manual `pnpm setup` needed.

**Windows Command Prompt / PowerShell:**
```powershell
.\setup_claw_empire.bat
```

> **Autoupdates**: Running `setup_claw_empire.bat` at any time on an existing installation checks for and downloads new features remotely from [https://github.com/GreenSheep01201/claw-empire](https://github.com/GreenSheep01201/claw-empire) without destroying your local SQLite database or `.env`.

**macOS / Linux:**
```bash
./setup_claw_empire.sh
```

> **Autoupdates**: Running the setup script at any time on an existing installation checks for and downloads new features remotely without destroying your local SQLite database or `.env`.

### Option B: Manual Setup (Fallback)

```powershell
# 1. Clone the repository
git clone https://github.com/GreenSheep01201/claw-empire.git
cd claw-empire

# 2. Enable pnpm via corepack
corepack enable

# 3. Install dependencies
pnpm install

# 4. Create your local environment file
Copy-Item .env.example .env

# 5. Generate a random encryption secret
node -e "const fs=require('fs');const crypto=require('crypto');const p='.env';const c=fs.readFileSync(p,'utf8');fs.writeFileSync(p,c.replace('__CHANGE_ME__',crypto.randomBytes(32).toString('hex')))"

# 6. Setup AGENTS.md orchestration rules
pnpm setup -- --port 8790

# 7. Start the development server
pnpm dev:local
```

### Verify Installation

**Windows PowerShell:**
```powershell
# Check setup files exist
if ((Test-Path .\.env) -and (Test-Path .\scripts\setup.mjs)) { "setup files ok" }

# Check AGENTS.md orchestration rules were injected
$agentCandidates = @("$env:USERPROFILE\.openclaw\workspace\AGENTS.md", ".\AGENTS.md")
$agentCandidates | ForEach-Object { if (Test-Path $_) { Select-String -Path $_ -Pattern "BEGIN claw-empire orchestration rules" } }

# Check OpenClaw inbox requirements in .env
Get-Content .\.env | Select-String -Pattern '^(INBOX_WEBHOOK_SECRET|OPENCLAW_CONFIG)='
```

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env`. **Never commit `.env` to version control.**

| Variable | Default | Description |
|---|---|---|
| `OAUTH_ENCRYPTION_SECRET` | *(generated)* | AES-256-GCM key for encrypting OAuth + messenger tokens at rest |
| `SESSION_SECRET` | *(fallback)* | Fallback encryption key if `OAUTH_ENCRYPTION_SECRET` is missing |
| `PORT` | `8790` | Backend API server port |
| `HOST` | `127.0.0.1` | Bind address (`127.0.0.1` = local only, `0.0.0.0` = network) |
| `API_AUTH_TOKEN` | *(optional)* | Protects browser access; entered at runtime via `sessionStorage` |
| `INBOX_WEBHOOK_SECRET` | *(auto-generated)* | Secures the `/api/inbox` webhook endpoint |
| `OPENCLAW_CONFIG` | — | **Absolute path** to your `openclaw.json` (e.g., `C:\Users\YourName\.openclaw\openclaw.json`) |
| `DB_PATH` | `./claw-empire.sqlite` | SQLite database location |
| `LOGS_DIR` | `./logs` | Log output directory |
| `OPENAI_API_KEY` | *(optional)* | Required if using Codex CLI provider |

---

## 4. Starting & Health-Checking

### Run Modes

```powershell
# Development (local-only, recommended)
pnpm dev:local        # binds to 127.0.0.1

# Windows Users: Robust local dev launcher (auto-cleans old processes on start)
.\scripts\run-claw-empire-dev-local.cmd

# Windows Users: Safe shutdown to release ports
.\scripts\kill-claw-empire-dev.ps1

# Development (network-accessible)
pnpm dev              # binds to 0.0.0.0

# Production build
pnpm build            # TypeScript check + Vite build
pnpm start            # serves dist in production mode
```

### Health Check & Auditing
In a separate terminal:
```powershell
curl -s http://127.0.0.1:8790/healthz
```
Expected response: `{"ok":true,...}`

Open the UI in your browser at: **`http://127.0.0.1:8800`**

**Auditing Agent States (Staff Cleanup):**
If you ever find an agent stuck on a "break" or need to audit role distribution, a built-in utility is available (added in v2.0.3):
```powershell
node scripts/cleanup-staff.mjs
```
This utility resets stuck staff to `idle`, reports role distribution, and detects duplicate names.

---

## 5. Provider Setup (CLI / OAuth / API)

Claw-Empire supports **three provider paths** for powering your agents:

### Path 1: CLI Tools (Local Processes)
Install at least one CLI tool globally, then configure it via the **Settings > CLI Tools** panel in the app.

| Provider | Install Command |
|---|---|
| Claude Code | `npm i -g @anthropic-ai/claude-code` |
| Codex CLI | `npm i -g @openai/codex` (requires `OPENAI_API_KEY` in `.env`) |
| Gemini CLI | `npm i -g @google/gemini-cli` |
| OpenCode | `npm i -g opencode` |

### Path 2: OAuth Accounts
Connect GitHub or Google-backed flows via the **Settings > OAuth** panel. Tokens are encrypted at rest (AES-256-GCM) and stored in the local SQLite database. The browser never receives refresh tokens.

### Path 3: Direct API Keys
Bind agents to external LLM APIs via **Settings > API**. Keys are stored encrypted in SQLite — not in `.env` or source code.

> **Note:** Skills learn/unlearn automation is currently designed for CLI-capable providers only.

---

## 6. Office Pack Profiles

When setting up a new company, choose a profile that matches your workflow:

| Profile | Code | Best For |
|---|---|---|
| `development` | DEV | Software engineering teams (default) |
| `report` | RPT | Business report generation |
| `web_research_report` | WEB | Research & analysis |
| `novel` | NOV | Creative writing |
| `video_preprod` | VID | Video pre-production |
| `roleplay` | RPG | Roleplay & simulation |
| **`fts`** | **FTS** | **Fintech Startup — compact autonomous 9-agent crew** |

### FTS: Fintech Startup Office Pack

This is the default pack shipped via the `setup_claw_empire.bat` integration. It provides a 9-agent autonomous team:

| Department | Role | Provider |
|---|---|---|
| Planning & Architecture | Orchestrator (Team Leader) | Claude |
| Planning & Architecture | Security Architect (Senior) | Gemini |
| Core Engineering | Sub1 — Frontend Engineer (Senior) | Codex |
| Core Engineering | Sub2 — Backend Engineer (Junior) | Claude |
| Core Engineering | Sub3 — DevOps & Cloud (Junior) | Gemini |
| Core Engineering | Data Engineer (Senior) | Codex |
| Quality & Compliance | Reviewer (Team Leader) | Codex |
| Quality & Compliance | Test Automation Engineer (Senior) | Claude |
| Quality & Compliance | Compliance Auditor (Junior) | Gemini |

See [`templates/claw-empire-integration/FTS_USE_CASE.md`](templates/claw-empire-integration/FTS_USE_CASE.md) for full details.


---

## 7. Wiring Discord to Claw-Empire

There are **two methods** to connect your Discord server. Choose the one that fits your setup.

### Method A: Via OpenClaw Bridge (Recommended for Existing Swarms)

If you already have OpenClaw bindings configured in `openclaw.json` (as set up in `MULTI_AGENT_SETUP.md`), you only need to point Claw-Empire to your config:

**Step 1:** Set the config path in `.env`:
```env
OPENCLAW_CONFIG=C:\Users\YourName\.openclaw\openclaw.json
```

**Step 2:** Set the webhook secret in `.env`:
```env
INBOX_WEBHOOK_SECRET=your_super_secret_string
```

**Step 3:** Start the server and verify:
```powershell
pnpm dev:local

# In another terminal:
curl -s http://127.0.0.1:8790/api/gateway/targets
```

Your OpenClaw Discord bindings will be detected automatically.

### Method B: Direct Messenger (No OpenClaw Required)

Claw-Empire can connect to Discord directly without OpenClaw:

1. Open **Settings > Channel Messages** in the app UI.
2. Click **Add Chat**.
3. Select **discord** as the messenger.
4. Fill in the session fields:
   - **Name**: A label for this session (e.g., `orchestrator-channel`)
   - **Messenger Token**: Your Discord Bot Token
   - **Channel/Chat ID**: The target Discord channel ID
   - **Mapped Agent**: Which Claw-Empire agent handles this channel
5. Click **Confirm** to save (persisted to SQLite immediately).
6. **Enable** the session.

> **Security Note:** Messenger tokens are encrypted at rest using AES-256-GCM with `OAUTH_ENCRYPTION_SECRET`. The old `.env` messenger variables (`DISCORD_BOT_TOKEN`, etc.) are **no longer used**.

### Verifying Messenger Sessions
```powershell
curl -s http://127.0.0.1:8790/api/messenger/sessions
```

---

## 8. The `$` CEO Directive Workflow

Once Discord is connected, you unlock Claw-Empire's most powerful feature: **CEO Directives** via the `$` prefix.

### How It Works

| Action | Behavior |
|---|---|
| `@Orchestrator Update the README` | Agent works immediately and independently |
| `@Orchestrator $Update the README` | Triggers the CEO Directive delegation flow |

### The Delegation Flow

When a message starting with `$` arrives:

1. **Interception**: OpenClaw/messenger detects the `$` prefix and forwards the message to Claw-Empire's `/api/inbox` webhook using `x-inbox-secret`.
2. **Team Sync Meeting**: The Orchestrator asks whether to hold a team-leader meeting first with the sub-agents.
3. **Workspace Context**: The Orchestrator requests `project_path` or `project_context` to ensure all agents share the same workspace state.
4. **Visual Delegation**: In the Claw-Empire pixel-art dashboard, you see the Orchestrator walk to the sub-agents and delegate task pieces based on the meeting outcome.

### Example: Full Meeting Flow
```powershell
curl -X POST http://127.0.0.1:8790/api/inbox `
  -H "content-type: application/json" `
  -H "x-inbox-secret: YOUR_INBOX_WEBHOOK_SECRET" `
  -d '{"source":"discord","author":"ceo","text":"$Release v0.2 by Friday with QA sign-off","project_path":"C:/Users/Admin/Desktop/PersonalWebsite/AgentsSwarm"}'
```

### Example: Urgent Bypass (Skip Meeting)
```powershell
curl -X POST http://127.0.0.1:8790/api/inbox `
  -H "content-type: application/json" `
  -H "x-inbox-secret: YOUR_INBOX_WEBHOOK_SECRET" `
  -d '{"source":"discord","author":"ceo","text":"$Hotfix production login bug immediately","skipPlannedMeeting":true,"project_context":"AgentsSwarm project"}'
```

### Inbox API Response Codes

| Code | Meaning |
|---|---|
| `200` | Success — `INBOX_WEBHOOK_SECRET` matches |
| `401` | `x-inbox-secret` header missing or mismatched |
| `503` | `INBOX_WEBHOOK_SECRET` not configured on server |

---

## 9. Applying to Your Agent Swarm

Here's how the FTS agents map to Claw-Empire's virtual company:

| Your Agent | Role | Department | Discord Channel |
|---|---|---|---|
| **Orchestrator** | CEO / PM (Team Leader) | Planning & Architecture | `#orchestrator` |
| **Security Architect** | DevSecOps & Compliance | Planning & Architecture | `#security` |
| **Sub1** | Frontend Engineer | Core Engineering | `#frontend` |
| **Sub2** | Backend Engineer | Core Engineering | `#backend` |
| **Sub3** | DevOps & Cloud | Core Engineering | `#devops` |
| **Data Engineer** | Data Pipelines | Core Engineering | `#data` |
| **Reviewer** | QA Lead (Team Leader) | Quality & Compliance | `#review` |
| **Test Automation Engineer** | E2E/Integration Testing | Quality & Compliance | `#testing` |
| **Compliance Auditor** | Regulatory Audit | Quality & Compliance | `#compliance` |

### CEO Directive Example (FTS use case)

```powershell
curl -X POST http://127.0.0.1:8790/api/inbox `
  -H "content-type: application/json" `
  -H "x-inbox-secret: YOUR_INBOX_WEBHOOK_SECRET" `
  -d '{"source":"discord","author":"ceo","text":"$Build and launch the payment gateway MVP by Friday with full QA sign-off and security audit","project_path":"C:/Users/Admin/Desktop/PersonalWebsite/AgentsSwarm"}'
```

### AGENTS.md Orchestration Rules

Orchestration rules are **automatically injected** into `AGENTS.md` on every dev server start — no manual `pnpm setup` needed. This teaches agents how to:
- Interpret `$` prefix CEO directives for priority task delegation
- Call the Claw-Empire REST API to create tasks, assign agents, and report status
- Work within isolated git worktrees for safe parallel development

---

## 10. Security Summary

| Feature | Detail |
|---|---|
| **Architecture** | Local-first. All data in SQLite. No cloud dependency. |
| **Token Encryption** | AES-256-GCM using `OAUTH_ENCRYPTION_SECRET` |
| **Browser Safety** | Refresh tokens never sent to browser |
| **Network** | Binds to `127.0.0.1` by default (localhost only) |
| **Secrets** | `.gitignore` blocks `.env`, `*.pem`, `*.key`, `credentials.json` |
| **Preflight** | Run `pnpm run preflight:public` before any public release |
| **License** | Apache 2.0 — Free for personal and commercial use |

---

## 🔀 Next Steps

Your AI Agent virtual office is now fully installed and configured!

1. **Explore Blueprints:** Check out [`USECASES.md`](USECASES.md) to discover real-world examples of how teams use this structure.
2. **Discord Routing:** If you want your company to operate via Discord channels, see [`MULTI_AGENT_ADVANCED.md`](MULTI_AGENT_ADVANCED.md).

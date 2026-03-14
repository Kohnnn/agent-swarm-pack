# GoClaw Setup Guide

[GoClaw](https://github.com/nextlevelbuilder/goclaw) is a **multi-agent AI gateway** deployed as a single Go binary with zero runtime dependencies. It connects LLMs to your tools, channels, and data with multi-tenant PostgreSQL and production-grade observability.

This guide shows how to install it next to your existing AgentSwarm workspace and use it as an additional orchestration gateway.

---

## 1. Prerequisites

Before starting, ensure the following are installed:

| Requirement | Version     | Check Command     |
| ----------- | ----------- | ----------------- |
| Go          | **1.25+**   | `go version`      |
| Docker      | **Recent**  | `docker --version`|
| git         | Any         | `git --version`   |

*Note: Docker is highly recommended to run the required PostgreSQL database and other services easily.*

---

## 2. Installation

### Option A: One-Click Setup (Recommended)

Use the included setup script from this repository root.

**Windows PowerShell:**

```powershell
.\setup_goclaw.bat
```

The installer will:
- Clone or update `https://github.com/nextlevelbuilder/goclaw`
- Download Go modules
- Generate the `.env` configuration file from `.env.example` using `prepare-env.sh` (or fallback to copy)

### Option B: Manual Setup

```bash
git clone https://github.com/nextlevelbuilder/goclaw.git
cd goclaw
go mod download
bash prepare-env.sh
```

---

## 3. Starting the Services

GoClaw requires PostgreSQL with pgvector. The easiest way to start it is using Docker Compose.

1. Ensure your `.env` file in the `goclaw` directory has your API keys (e.g., `GOCLAW_OPENROUTER_API_KEY`).
2. Run the full stack (Gateway + Web Dashboard + Postgres) via Docker Compose:

```bash
cd goclaw
docker compose -f docker-compose.yml -f docker-compose.postgres.yml -f docker-compose.selfservice.yml up -d --build
```

Then open `http://localhost:3000` in your browser.

If you just want to run the Go binary locally connecting to an external database, you can use:

**Windows PowerShell:**

```powershell
.\start_goclaw.bat
```

---

## 4. Integration with AgentSwarm

GoClaw can be used as a high-performance backend gateway for your agents in AgentSwarm's architecture.

1. Configure GoClaw to run on a specific port (default is `18790`).
2. Point your AgentSwarm agent configurations to route requests to the GoClaw HTTP or WebSocket API endpoints.
3. Utilize GoClaw's advanced features like Agent Teams, Handoff, and Quality Gates to coordinate complex agent workflows, while keeping AgentSwarm as the chat-first runtime or primary UI.

---

## 5. Security Notes

- Keep `.env` and `.env.local` private and out of version control.
- GoClaw uses AES-256-GCM to encrypt API keys in the database.
- Do not expose GoClaw directly on the public internet without TLS and reverse proxy.

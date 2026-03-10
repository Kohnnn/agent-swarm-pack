# SwarmClaw Setup Guide

[SwarmClaw](https://github.com/swarmclawai/swarmclaw) is a **self-hosted orchestration dashboard** for OpenClaw swarms. It adds a control-plane UI for multi-provider routing, task scheduling, chat connectors, and OpenClaw gateway management from one place.

This guide shows how to install it next to your existing AgentSwarm workspace and use it as an additional control-plane companion.

---

## 1. Prerequisites

Before starting, ensure the following are installed:

| Requirement | Version   | Check Command   |
| ----------- | --------- | --------------- |
| Node.js     | **22.6+** | `node -v`       |
| npm         | **10+**   | `npm -v`        |
| git         | Any       | `git --version` |

---

## 2. Installation

### Option A: One-Click Setup (Recommended)

Use the included setup script from this repository root.

**Windows PowerShell:**

```powershell
.\setup_swarmclaw.bat
```

**macOS / Linux:**

```bash
./setup_swarmclaw.sh
```

The installer will:

- Clone or update `https://github.com/swarmclawai/swarmclaw`
- Install dependencies with `npm install`
- Run `npm run setup:easy -- --skip-install`
- Preserve your existing `swarmclaw/data` and `.env.local` on re-runs

### Option B: Manual Setup

```bash
git clone https://github.com/swarmclawai/swarmclaw.git
cd swarmclaw
npm install
npm run setup:easy -- --skip-install
npm run dev
```

Open: `http://127.0.0.1:3456`

---

## 3. First Run and Access Key

On first launch, SwarmClaw prints an access key in the terminal and stores it in `.env.local`.

1. Start SwarmClaw (`start_swarmclaw` script or `npm run dev`).
2. Copy the terminal access key.
3. Open `http://127.0.0.1:3456`.
4. Paste the key into the first-run screen and complete onboarding.

If you installed with the script wrappers:

- Windows: `./start_swarmclaw.bat`
- macOS/Linux: `./start_swarmclaw.sh`

---

## 4. Connect OpenClaw Gateways

SwarmClaw can manage one or multiple OpenClaw gateways (local or remote).

Recommended sequence:

1. In SwarmClaw, open **Providers -> OpenClaw Gateways**.
2. Add a gateway profile (local runtime or remote endpoint + token).
3. Run the built-in connection verify flow.
4. Save profile and mark a default if needed.
5. For each SwarmClaw agent, toggle **OpenClaw Gateway** ON and select the gateway profile.

This lets one SwarmClaw dashboard coordinate multiple OpenClaw runtimes.

---

## 5. Optional CLI Control

SwarmClaw exposes OpenClaw deploy/lifecycle commands directly from its CLI:

```bash
swarmclaw openclaw deploy-status
swarmclaw openclaw deploy-local-start --data '{"port":18789}'
swarmclaw openclaw deploy-verify --data '{"endpoint":"https://openclaw.example.com/v1"}'
```

---

## 6. Recommended Use With AgentSwarm

Use both platforms together for maximum coverage:

- **AgentSwarm:** compact chat-first runtime, hybrid task execution, compact packs, provider profile selection
- **SwarmClaw:** control-plane operations, provider management, task scheduler, connectors, OpenClaw fleet controls

Cross-reference:

- [`agentsswarm/README.md`](agentsswarm/README.md)
- [`SWARMCLAW_GUIDANCE.md`](SWARMCLAW_GUIDANCE.md)

---

## 7. Security Notes

- Keep `.env.local` and `data/` private and out of version control.
- Do not expose SwarmClaw directly on public internet without TLS and reverse proxy.
- Keep OpenClaw gateway tokens private and rotate if leaked.

---

## Next Steps

1. Read [`SWARMCLAW_GUIDANCE.md`](SWARMCLAW_GUIDANCE.md) for platform selection by use case.
2. Review [`MULTI_AGENT_SETUP.md`](MULTI_AGENT_SETUP.md) to align your OpenClaw bindings with your dashboard topology.
3. Keep using [`agentsswarm/README.md`](agentsswarm/README.md) as the primary local runtime guide.

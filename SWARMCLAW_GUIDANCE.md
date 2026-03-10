# SwarmClaw Guidance for Agent Swarms

This guide helps you decide when to stay with the compact `agentsswarm/` runtime only and when to add SwarmClaw as a companion control plane.

---

## 1. Platform Positioning

| Platform       | Primary Strength           | Best For                                                                         |
| -------------- | -------------------------- | -------------------------------------------------------------------------------- |
| **AgentSwarm** | Compact chat-first runtime | `$` and `#` command handling, compact packs, hybrid execution, provider profiles |
| **SwarmClaw**  | Control-plane dashboard    | Multi-gateway operations, provider routing, scheduling, connectors               |

Decision rule:

- Start with **AgentSwarm** when you want the fastest end-to-end runtime.
- Add **SwarmClaw** when you need dashboard-style visibility and connector/gateway operations.
- Keep both when you want a compact chat runtime plus a separate operations console.

---

## 2. Recommended Combined Architecture

Use this split for your swarm:

1. **OpenClaw gateways** handle core agent runtime execution.
2. **AgentSwarm** acts as the compact orchestration runtime:
   - chat command intake
   - compact packs
   - hybrid board plus direct-run semantics
   - provider profile selection
   - managed task status relay
3. **SwarmClaw** acts as the companion control plane:
   - provider profiles at the dashboard layer
   - gateway profiles
   - connectors
   - task board and schedule automations

This gives you a practical operator split: AgentSwarm for work intake and hybrid execution, SwarmClaw for runtime operations.

---

## 3. Use-Case Mapping

### A) Founder Daily Operations

- **AgentSwarm-heavy:** compact software/support packs, direct command handling, daily work relay
- **SwarmClaw support:** reminders, cron tasks, connector health, gateway management

### B) Engineering Delivery Sprint

- **AgentSwarm-heavy:** `software-6`, hybrid task execution, review loop, compact provider mix
- **SwarmClaw support:** dashboard task board, provider routing oversight, connector fleet management

### C) Compliance + Audit Workflow

- **AgentSwarm-heavy:** `research-5` or `ops-5` for scoped analysis and action loops
- **SwarmClaw support:** secure control-plane visibility, policy, and operational checks

---

## 4. Migration Path (Current Repo)

Start from your current setup and add SwarmClaw only when needed:

1. Keep your current OpenClaw + AgentSwarm flow unchanged.
2. Install SwarmClaw via [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md).
3. Add one OpenClaw gateway profile and verify connection.
4. Move one use case first (for example, scheduled automation or connector routing operations).
5. Expand to multi-gateway and multi-provider control after baseline success.

---

## 5. Operational Guardrails

- Keep **AgentSwarm** as the runtime of record for compact chat execution.
- Keep **SwarmClaw** as the dashboard of record for runtime, connector, and gateway health.
- Preserve both local data stores (`agentsswarm/data/*`, `swarmclaw/data/*`) with backups.
- Put any internet-exposed endpoint behind TLS and strict token hygiene.

---

## 6. Commands at a Glance

**Install and launch AgentSwarm from this repo root:**

```powershell
.\setup_agentsswarm.bat
.\start_agentsswarm.bat --doctor
```

```bash
./setup_agentsswarm.sh
./start_agentsswarm.sh --doctor
```

**Add SwarmClaw when you need the control plane:**

```powershell
.\setup_swarmclaw.bat
.\start_swarmclaw.bat
```

```bash
./setup_swarmclaw.sh
./start_swarmclaw.sh
```

---

## 7. Recommended Policy for This Repo

- Use **AgentSwarm** as the default local app.
- Add **SwarmClaw** when you want dashboard-first operations.
- Keep **OpenClaw** as the shared runtime backbone so both stay interoperable.

Legacy note: the older visual office docs remain in the repo as reference material, but they are no longer the primary path.

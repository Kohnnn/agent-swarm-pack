# DevOpsCorp — Coding & Release Workflow Pack

**Use case:** Automate software development workflows — intake tasks, distribute to execution tracks, review, and release.

## The Promise

Drop a task in. Get a merged, reviewed, release-ready output. The orchestrator plans, sub-agents execute, the reviewer checks, and you get clean delivery — no micromanaging.

## Agent Roster

| Agent | Role | Responsibility |
|-------|------|---------------|
| `orchestrator` | Planner + Intake | Breaks tasks into sub-tracks, routes work, tracks status |
| `sub1` | Execution Track A | Backend/API implementation |
| `sub2` | Execution Track B | Automation scripts and integrations |
| `sub3` | Execution Track C | Documentation and ops artifacts |
| `reviewer` | QA Gate | Quality checks, release readiness decision |
| `compliance_auditor` | DevSecOps Review | Threat modeling, dependency scanning, compliance |
| `data_engineer` | Data Specialist | Data pipeline and ETL architecture |
| `security_architect` | Security Review | Vulnerability assessment, secure-by-default patterns |
| `test_automation` | Test Strategy | Test planning and automation coverage |

## How It Works

### Task Intake Flow

```
User → #inbox-user
         ↓
    orchestrator
         ↓
   sub1 / sub2 / sub3 (parallel execution)
         ↓
      reviewer gate
         ↓
    #release-ready (approved output)
```

### Execution Tracks

- **sub1** — backend, APIs, server-side logic
- **sub2** — automation, scripts, tooling integrations
- **sub3** — docs, ops guides, support artifacts

### Review Gate

`reviewer` is the last checkpoint before anything is marked release-ready. Security and compliance checks run in parallel before the reviewer gate.

## Discord Channel Map

| Channel | Purpose |
|---------|---------|
| `#inbox-user` | User → orchestrator intake |
| `#brainstorm-orchestrator` | Orchestrator planning and sub-agent coordination |
| `#work-sub1` | Track A execution |
| `#work-sub2` | Track B execution |
| `#work-sub3` | Track C execution |
| `#reviewer-gate` | Review submission queue |
| `#release-ready` | Approved output for delivery |

## Workflow Steps

### 1. Deploy the Pack

```bash
for agent in orchestrator sub1 sub2 sub3 reviewer compliance_auditor data_engineer security_architect test_automation; do
  openclaw agents add $agent --workspace ~/.openclaw/workspace-$agent
done
```

### 2. Copy Shared Files

```bash
for agent in orchestrator sub1 sub2 sub3 reviewer compliance_auditor data_engineer security_architect test_automation; do
  cp templates/samples/shared/USER.md ~/.openclaw/workspace-$agent/USER.md
  cp templates/samples/shared/TOOLS.md ~/.openclaw/workspace-$agent/TOOLS.shared.md
done
```

### 3. Copy Agent Files

```bash
# Example for orchestrator
cp templates/samples/dev-ops-corp/orchestrator/SOUL.md ~/.openclaw/workspace-orchestrator/SOUL.md
cp templates/samples/dev-ops-corp/orchestrator/AGENTS.md ~/.openclaw/workspace-orchestrator/AGENTS.md
cp templates/samples/dev-ops-corp/orchestrator/IDENTITY.md ~/.openclaw/workspace-orchestrator/IDENTITY.md
cp templates/samples/dev-ops-corp/orchestrator/TOOLS.md ~/.openclaw/workspace-orchestrator/TOOLS.md

# Repeat for each agent (sub1, sub2, sub3, reviewer, compliance_auditor, data_engineer, security_architect, test_automation)
```

### 4. Import Identities

```bash
for agent in orchestrator sub1 sub2 sub3 reviewer compliance_auditor data_engineer security_architect test_automation; do
  openclaw agents set-identity --workspace ~/.openclaw/workspace-$agent --from-identity
done
```

### 5. Validate

```bash
openclaw agents list --bindings --json
openclaw channels status --probe
openclaw gateway status
```

## Typical Usage

### Submit a Task

In `#inbox-user`, send:
```
Build a REST API endpoint for user authentication with JWT tokens
```

### Check Status

The orchestrator will break this into tracks and route to sub1/sub2/sub3. Watch `#brainstorm-orchestrator` for the task graph and `#reviewer-gate` for the review queue.

### Receive Output

Approved work appears in `#release-ready`.

## Non-Negotiables

- Never mark release-ready without reviewer PASS
- Never bypass the reviewer gate
- Escalate security findings to compliance_auditor and security_architect before reviewer gate
- Sub-agents don't speak directly to users — orchestrator owns all user communication

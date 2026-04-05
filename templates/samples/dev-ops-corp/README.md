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

> **GoClaw teams use task boards internally for team coordination.** The map below is retained for reference when wiring individual agents to Discord channels, but team-internal workflow uses GoClaw's shared task board and mailbox.

| Channel | Purpose |
|---------|---------|
| `#inbox-user` | User → orchestrator intake |
| `#brainstorm-orchestrator` | Orchestrator planning and sub-agent coordination |
| `#work-sub1` | Track A execution |
| `#work-sub2` | Track B execution |
| `#work-sub3` | Track C execution |
| `#reviewer-gate` | Review submission queue |
| `#release-ready` | Approved output for delivery |

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

---

## GoClaw Team Deployment

Deploy this pack as a GoClaw agent team with shared task board and mailbox.

### 1. Create the team

```bash
goclaw team create devops-corp
```

### 2. Create and add agents

```bash
goclaw agents create orchestrator --team devops-corp --role lead
goclaw agents create sub1 --team devops-corp
goclaw agents create sub2 --team devops-corp
goclaw agents create sub3 --team devops-corp
goclaw agents create reviewer --team devops-corp
goclaw agents create compliance_auditor --team devops-corp
goclaw agents create data_engineer --team devops-corp
goclaw agents create security_architect --team devops-corp
goclaw agents create test_automation --team devops-corp
```

### 3. Inject context files

```bash
for agent in orchestrator sub1 sub2 sub3 reviewer compliance_auditor data_engineer security_architect test_automation; do
  goclaw agents inject $agent --path templates/samples/dev-ops-corp/$agent/
done
```

### 4. Inject shared files

```bash
for agent in orchestrator sub1 sub2 sub3 reviewer compliance_auditor data_engineer security_architect test_automation; do
  goclaw agents inject $agent --path templates/samples/shared/USER.md --target USER.md
  goclaw agents inject $agent --path templates/samples/shared/TOOLS.md --target TOOLS.md
done
```

### 5. Configure delegation links

```bash
goclaw team link devops-corp --from orchestrator --to sub1
goclaw team link devops-corp --from orchestrator --to sub2
goclaw team link devops-corp --from orchestrator --to sub3
goclaw team link devops-corp --from orchestrator --to reviewer
goclaw team link devops-corp --from orchestrator --to compliance_auditor
goclaw team link devops-corp --from orchestrator --to data_engineer
goclaw team link devops-corp --from orchestrator --to security_architect
goclaw team link devops-corp --from orchestrator --to test_automation
```

### 6. Bind to channel

```bash
goclaw channels bind devops-corp --channel discord:#devops-inbox
```

For full details on team task board workflow, delegation patterns, and per-pack tool configuration, see [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md).

---

## Internal Task Board Workflow

When GoClaw team task board is active:

| Stage | Task | Owner |
|-------|------|-------|
| Intake | `devops: intake + plan` | `orchestrator` |
| Track A | `devops: execute sub1` | `sub1` |
| Track B | `devops: execute sub2` | `sub2` |
| Track C | `devops: execute sub3` | `sub3` |
| Security | `devops: security review` | `security_architect` |
| Compliance | `devops: compliance check` | `compliance_auditor` |
| Testing | `devops: test planning` | `test_automation` |
| Data | `devops: data pipeline` | `data_engineer` |
| Review | `devops: QA gate` | `reviewer` |
| Release | `devops: release ready` | `orchestrator` |

orchestrator creates tasks for all sub-tracks in parallel. security_architect, compliance_auditor, and test_automation run in parallel after sub-tracks complete. reviewer is the final gate before orchestrator marks release-ready.

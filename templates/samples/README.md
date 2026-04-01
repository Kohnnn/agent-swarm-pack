# Agent Swarm Sample Packs (Discord + OpenClaw)

This repository contains curated agent swarm packs for different use cases. Each pack is a self-contained multi-agent team (1 lead + 5 members max) wired for Discord and OpenClaw.

## Pack Library

### DevOpsCorp — Coding & Dev Workflows

Located in `DevOpsCorp/`, these packs specialize in software engineering and release workflows.

#### Included Packs

| Pack | Lead | Members | Purpose |
|------|------|---------|---------|
| `orchestrator` | — | — | Planning, intake, task routing |
| `sub1` | — | — | Execution track A (backend/API) |
| `sub2` | — | — | Execution track B (automation/scripts) |
| `sub3` | — | — | Execution track C (docs/ops) |
| `reviewer` | — | — | QA gate, release readiness |
| `compliance_auditor` | — | — | DevSecOps & compliance architecture |
| `data_engineer` | — | — | Data pipeline & ETL specialist |
| `security_architect` | — | — | Threat modeling, vulnerability review |
| `test_automation` | — | — | Test strategy & automation |

#### Research Report Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `research_lead` | Coordinates research, synthesizes findings, owns delivery |
| `crawler_specialist` | Web/data harvesting, source identification |
| `fact_check_lead` | Claim verification, confidence levels |
| `data_analyst` | Statistical processing, pattern detection |
| `technical_writer` | Drafts sections, translates for audience |
| `summary_editor` | Final polish, formatting, release gate |

#### Review Desk Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `review_lead` | Queue management, final verdicts (PASS/FAIL) |
| `technical_reviewer` | Code correctness, architecture, edge cases |
| `compliance_reviewer` | Regulatory/policy alignment |
| `style_guide_enforcer` | Brand voice, formatting, accessibility |
| `quality_assurance` | Testing, release readiness sign-off |
| `feedback_curator` | Synthesizes and delivers reviewer feedback |

#### Financial Analyst Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `finance_lead` | Strategic direction, recommendation synthesis |
| `market_researcher` | Market conditions, competitive landscape |
| `quantitative_analyst` | Statistical modeling, pattern analysis |
| `risk_assessor` | Scenario analysis, stress tests, risk matrices |
| `finance_report_writer` | Narrative drafting, executive summaries |
| `data_visualizer` | Charts, dashboards, presentation visuals |

---

## Agent File Structure

Each agent folder contains:

- `SOUL.md` — persona, core truths, scope, hard constraints
- `AGENTS.md` — workspace conventions, safety, memory, heartbeat policy
- `IDENTITY.md` — public persona metadata (name, emoji, communication style)
- `TOOLS.md` — role-specific tool notes and operational guardrails

Shared across all agents:

- `shared/USER.md` — human profile, project context, decision preferences
- `shared/TOOLS.md` — Discord channels, runtime paths, provider setup

---

## Discord Channel Map (DevOpsCorp Default)

| Channel | Purpose |
|---------|---------|
| `#inbox-user` | User requests → orchestrator intake |
| `#brainstorm-orchestrator` | Research team coordination |
| `#work-sub1` | Execution track A |
| `#work-sub2` | Execution track B |
| `#work-sub3` | Execution track C |
| `#reviewer-gate` | Review submission queue |
| `#release-ready` | Approved output for delivery |

---

## Quick Start — Deploy a Pack

### 1. Create agents and workspaces

```bash
# Example: deploy research_report pack
openclaw agents add research_lead --workspace ~/.openclaw/workspace-research_lead
openclaw agents add crawler_specialist --workspace ~/.openclaw/workspace-crawler_specialist
openclaw agents add fact_check_lead --workspace ~/.openclaw/workspace-fact_check_lead
openclaw agents add data_analyst --workspace ~/.openclaw/workspace-data_analyst
openclaw agents add technical_writer --workspace ~/.openclaw/workspace-technical_writer
openclaw agents add summary_editor --workspace ~/.openclaw/workspace-summary_editor
openclaw agents list --json
```

### 2. Copy shared files into each workspace

```bash
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  cp templates/samples/shared/USER.md ~/.openclaw/workspace-$agent/USER.md
  cp templates/samples/shared/TOOLS.md ~/.openclaw/workspace-$agent/TOOLS.shared.md
done
```

### 3. Copy agent files into each workspace

```bash
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  cp templates/samples/DevOpsCorp/research_report/$agent/SOUL.md ~/.openclaw/workspace-$agent/SOUL.md
  cp templates/samples/DevOpsCorp/research_report/$agent/AGENTS.md ~/.openclaw/workspace-$agent/AGENTS.md
  cp templates/samples/DevOpsCorp/research_report/$agent/IDENTITY.md ~/.openclaw/workspace-$agent/IDENTITY.md
  cp templates/samples/DevOpsCorp/research_report/$agent/TOOLS.md ~/.openclaw/workspace-$agent/TOOLS.md
done
```

### 4. Import identities

```bash
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  openclaw agents set-identity --workspace ~/.openclaw/workspace-$agent --from-identity
done
```

### 5. Validate bindings

```bash
openclaw agents list --bindings --json
openclaw channels status --probe
openclaw gateway status
```

---

## Provider Setup

```bash
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"

openclaw onboard --auth-choice openai-codex
openclaw models auth login --provider openai-codex

openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

Provider mapping guidance (per pack):

- **Lead agents** — high-reasoning model
- **Specialist members** — balanced cost/performance model
- **Review/QA agents** — reliable model with strict quality checks

---

## Config Sample

Use `openclaw.discord.swarm.sample.json5` as the base and replace placeholders.

---

## Prompt Starters

Use `PROMPTS.md` for role-specific task prompts.

---

## Adding New Packs

Each pack follows the same structure:

```
pack_name/
├── lead_agent/
│   ├── SOUL.md
│   ├── AGENTS.md
│   ├── IDENTITY.md
│   └── TOOLS.md
├── member_1/
│   └── ...
├── member_2/
│   └── ...
├── member_3/
│   └── ...
├── member_4/
│   └── ...
└── member_5/
    └── ...
```

The injection workflow is identical for any pack — just swap the pack path and agent names.

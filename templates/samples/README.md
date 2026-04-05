# Agent Swarm Sample Packs (GoClaw)

This repository contains curated agent swarm packs for different use cases. Each pack is a self-contained multi-agent team (1 lead + up to 5 members) deployable as a GoClaw agent team with a shared task board, mailbox, and delegation links.

> **Note:** These packs were originally built for OpenClaw. They are fully compatible with GoClaw — see [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md) for the complete porting and deployment guide.

## Pack Library

### DevOpsCorp — Coding & Dev Workflows

Located in `dev-ops-corp/`, these packs specialize in software engineering and release workflows.

| Agent | Role |
|-------|------|
| `orchestrator` | Planning, intake, task routing |
| `sub1` | Execution track A (backend/API) |
| `sub2` | Execution track B (automation/scripts) |
| `sub3` | Execution track C (docs/ops) |
| `reviewer` | QA gate, release readiness |
| `compliance_auditor` | DevSecOps & compliance architecture |
| `data_engineer` | Data pipeline & ETL specialist |
| `security_architect` | Threat modeling, vulnerability review |
| `test_automation` | Test strategy & automation |

### Research Report Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `research_lead` | Coordinates research, synthesizes findings, owns delivery |
| `crawler_specialist` | Web/data harvesting, source identification |
| `fact_check_lead` | Claim verification, confidence levels |
| `data_analyst` | Statistical processing, pattern detection |
| `technical_writer` | Drafts sections, translates for audience |
| `summary_editor` | Final polish, formatting, release gate |

### Review Desk Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `review_lead` | Queue management, final verdicts (PASS/FAIL) |
| `technical_reviewer` | Code correctness, architecture, edge cases |
| `compliance_reviewer` | Regulatory/policy alignment |
| `style_guide_enforcer` | Brand voice, formatting, accessibility |
| `quality_assurance` | Testing, release readiness sign-off |
| `feedback_curator` | Synthesizes and delivers reviewer feedback |

### Financial Analyst Pack (1 Lead + 5)

| Agent | Role |
|-------|------|
| `finance_lead` | Strategic direction, recommendation synthesis |
| `market_researcher` | Market conditions, competitive landscape |
| `quantitative_analyst` | Statistical modeling, pattern analysis |
| `risk_assessor` | Scenario analysis, stress tests, risk matrices |
| `finance_report_writer` | Narrative drafting, executive summaries |
| `data_visualizer` | Charts, dashboards, presentation visuals |

### Second Brain Pack (1 Lead + 6)

| Agent | Role |
|-------|------|
| `orchestrator_agent` | Central coordinator (Thalamus: routing & signal filtering) |
| `capture_agent` | Intake & collection (Sensory cortex: initial processing) |
| `tagger_agent` | Semantic tagging & categorization |
| `memory_writer_agent` | Memory consolidation (Hippocampus: encoding & retrieval) |
| `search_agent` | Query processing & recall |
| `recall_agent` | Long-term memory retrieval |
| `synthesis_agent` | Cross-domain synthesis (Prefrontal cortex: reasoning) |

---

## Agent File Structure

Each agent folder contains:

- `SOUL.md` — persona, core truths, scope, hard constraints
- `AGENTS.md` — workspace conventions, safety, memory, heartbeat policy
- `IDENTITY.md` — public persona metadata (name, emoji, communication style)
- `TOOLS.md` — role-specific tool notes and operational guardrails

Shared across all agents in a pack:

- `shared/USER.md` — human profile, project context, decision preferences
- `shared/TOOLS.md` — channel IDs, runtime paths, provider setup

---

## GoClaw Team Deployment

GoClaw deploys packs as **agent teams** — one lead agent plus member agents, all sharing a task board (`team_tasks` tool), mailbox for async delegation, and configurable cron schedules.

For the full step-by-step walkthrough, see [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md).

### Quick Deploy (Research Report Pack Example)

```bash
# 1. Create the team
goclaw team create research-swarm

# 2. Create agents and add to team
goclaw agents create research_lead --team research-swarm --role lead
goclaw agents create crawler_specialist --team research-swarm
goclaw agents create fact_check_lead --team research-swarm
goclaw agents create data_analyst --team research-swarm
goclaw agents create technical_writer --team research-swarm
goclaw agents create summary_editor --team research-swarm

# 3. Inject context files (SOUL, IDENTITY, AGENTS, TOOLS)
goclaw agents inject research_lead --path templates/samples/research_report/research_lead/
goclaw agents inject crawler_specialist --path templates/samples/research_report/crawler_specialist/
goclaw agents inject fact_check_lead --path templates/samples/research_report/fact_check_lead/
goclaw agents inject data_analyst --path templates/samples/research_report/data_analyst/
goclaw agents inject technical_writer --path templates/samples/research_report/technical_writer/
goclaw agents inject summary_editor --path templates/samples/research_report/summary_editor/

# 4. Inject shared files
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  goclaw agents inject $agent --path templates/samples/shared/USER.md --target USER.md
  goclaw agents inject $agent --path templates/samples/shared/TOOLS.md --target TOOLS.md
done

# 5. Configure delegation links (lead → members)
goclaw team link research-swarm --from research_lead --to crawler_specialist
goclaw team link research-swarm --from research_lead --to fact_check_lead
goclaw team link research-swarm --from research_lead --to data_analyst
goclaw team link research-swarm --from research_lead --to technical_writer
goclaw team link research-swarm --from research_lead --to summary_editor

# 6. Bind to a channel
goclaw channels bind research-swarm --channel telegram:@YourResearchBot
```

### GoClaw vs OpenClaw Command Map

| Operation | OpenClaw | GoClaw |
|-----------|----------|--------|
| Create agent | `openclaw agents add` | `goclaw agents create` |
| Inject files | Manual cp | `goclaw agents inject` |
| List agents | `openclaw agents list` | `goclaw agents list` |
| Team setup | N/A | `goclaw team create` |
| Delegation | Via channels | Via `team_tasks` + mailbox |
| Bind channel | `openclaw channels bind` | `goclaw channels bind` |

---

## Discord Channel Map (DevOpsCorp — Legacy)

> **GoClaw teams use task boards instead of Discord channels for internal coordination.** The map below is retained for reference when wiring individual agents to Discord, but the team-internal workflow uses GoClaw's shared task board and mailbox.

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

## Provider Setup

```bash
goclaw config set openai_api_key "$OPENAI_API_KEY"
goclaw config set anthropic_api_key "$ANTHROPIC_API_KEY"
goclaw models default --provider openai --model gpt-4o
```

Model guidance per agent role:

- **Lead agents** — high-reasoning model (e.g., `gpt-4o`, `claude-sonnet-4`)
- **Specialist members** — balanced cost/performance model (e.g., `gpt-4o-mini`, `claude-haiku-4`)
- **Review/QA agents** — reliable model with strong instruction following

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
├── member_5/
│   └── ...
└── shared/
    ├── USER.md
    └── TOOLS.md
```

The GoClaw injection workflow is identical for any pack — swap the pack path and agent names. See [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md) for the full per-pack tool configuration commands.

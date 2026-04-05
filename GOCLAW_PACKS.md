# Porting Agent Packs to GoClaw

This guide shows how to take any agent pack from `templates/samples/` and deploy it as a GoClaw agent team. It covers the mapping between the 4-file per-agent structure and GoClaw's context file system, team creation, tool configuration, and pack-specific deployment steps.

**Prerequisite:** GoClaw installed and running. See [GOCLAW_SETUP.md](GOCLAW_SETUP.md) for installation.

---

## Pack vs. Team Mapping

| Pack Concept | GoClaw Concept |
|-------------|---------------|
| Pack | Team |
| Lead agent | Team lead (1 per team) |
| Specialist members | Team members (up to 5) |
| 4 files per agent | Context files per agent (`SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `TOOLS.md`) |
| Discord channel routing | Team task board + mailbox |
| Orchestrator script | Sync/async delegation |
| `#channel` coordination | `team_tasks` tool + `announce_queue` |

---

## Context File Mapping

Each agent in a pack has 4 files. They map directly to GoClaw context files:

### `SOUL.md` → `SOUL.md`

GoClaw's `SOUL.md` is identical to the pack's `SOUL.md`. Inject it as the persona foundation:

```bash
./goclaw agents update research_lead --context-files templates/samples/research_report/research_lead/SOUL.md
```

### `IDENTITY.md` → `IDENTITY.md`

GoClaw's `IDENTITY.md` maps exactly. Inject alongside SOUL:

```bash
./goclaw agents update research_lead \
  --context-files templates/samples/research_report/research_lead/SOUL.md \
              templates/samples/research_report/research_lead/IDENTITY.md
```

> **Tip:** GoClaw's dashboard lets you upload all context files at once via drag-and-drop.

### `AGENTS.md` → (integrated into system prompt)

The pack's `AGENTS.md` contains workspace conventions, group chat rules, heartbeat policy, memory handling, etc. In GoClaw, these conventions live in two places:

1. **`SOUL.md`** — add conventions as additional sections
2. **GoClaw system prompt sections** — GoClaw auto-injects these from the built-in `AGENTS.md` template:
   - Conversational style (conciseness, format)
   - Group chat behavior (when to speak, NO_REPLY)
   - Platform formatting (Discord/Telegram/etc.)
   - Heartbeat and cron conventions

For pack-specific conventions (e.g., research desk's `fact-check gate`), append them to the agent's `SOUL.md`:

```markdown
## Pack-Specific Conventions

### Fact-Check Gate
- No claim enters the report without fact_check_lead verification
- All claims must be cited with source, date, and confidence level
- VERIFIED / UNVERIFIED / DISPUTED / FALSE confidence tiers
```

### `TOOLS.md` → `TOOLS.md`

GoClaw agents have a default toolset. The pack's `TOOLS.md` overrides/adds pack-specific tool notes:

```bash
./goclaw agents update research_lead \
  --context-files templates/samples/research_report/research_lead/TOOLS.md
```

### `USER.md` → `USER.md`

The human's profile. In GoClaw multi-tenant mode, this is per-user. For a single-user pack, inject it:

```bash
./goclaw agents update research_lead \
  --context-files templates/samples/shared/USER.md
```

---

## Complete Deployment Walkthrough: Research Report Pack

### Step 1: Create the Team

```bash
./goclaw teams create \
  --name "research-report" \
  --lead research_lead
```

### Step 2: Create All Agents

```bash
./goclaw agents add --name research_lead --provider anthropic
./goclaw agents add --name crawler_specialist --provider openai
./goclaw agents add --name fact_check_lead --provider anthropic
./goclaw agents add --name data_analyst --provider openai
./goclaw agents add --name technical_writer --provider openai
./goclaw agents add --name summary_editor --provider anthropic
```

### Step 3: Add Agents to Team

```bash
./goclaw teams add research-report \
  --agents crawler_specialist fact_check_lead data_analyst technical_writer summary_editor
```

### Step 4: Inject Context Files

```bash
# Lead agent
./goclaw agents update research_lead \
  --context-files templates/samples/research_report/research_lead/SOUL.md \
              templates/samples/research_report/research_lead/IDENTITY.md \
              templates/samples/research_report/research_lead/AGENTS.md \
              templates/samples/research_report/research_lead/TOOLS.md \
              templates/samples/shared/USER.md

# Specialists
./goclaw agents update crawler_specialist \
  --context-files templates/samples/research_report/crawler_specialist/SOUL.md \
              templates/samples/research_report/crawler_specialist/IDENTITY.md \
              templates/samples/research_report/crawler_specialist/AGENTS.md \
              templates/samples/research_report/crawler_specialist/TOOLS.md

./goclaw agents update fact_check_lead \
  --context-files templates/samples/research_report/fact_check_lead/

./goclaw agents update data_analyst \
  --context-files templates/samples/research_report/data_analyst/

./goclaw agents update technical_writer \
  --context-files templates/samples/research_report/technical_writer/

./goclaw agents update summary_editor \
  --context-files templates/samples/research_report/summary_editor/
```

### Step 5: Configure Tools per Agent

```bash
# Lead: full orchestration toolkit
./goclaw agents update research_lead \
  --tools team_tasks,spawn,memory_search,knowledge_graph_search,cron

# Crawler: web research tools
./goclaw agents update crawler_specialist \
  --tools team_tasks,web_search,web_fetch,memory_search

# Fact-check: verification tools
./goclaw agents update fact_check_lead \
  --tools team_tasks,memory_search,web_fetch

# Data analyst: analysis tools
./goclaw agents update data_analyst \
  --tools team_tasks,memory_search

# Writer: document tools
./goclaw agents update technical_writer \
  --tools team_tasks,memory_search,read_file,write_file

# Editor: final gate
./goclaw agents update summary_editor \
  --tools team_tasks,memory_search,read_file
```

### Step 6: Add Pack-Specific Skills

Create a research methodology skill:

```bash
mkdir -p ~/.goclaw/skills-store/research-methodology
cp templates/samples/research_report/skills/research-methodology/SKILL.md \
   ~/.goclaw/skills-store/research-methodology/
./goclaw skills add research-methodology
./goclaw agents update research_lead --skills research-methodology
./goclaw agents update fact_check_lead --skills research-methodology
```

### Step 7: Configure Delegation Links

GoClaw's team system uses permission links for inter-agent delegation:

```bash
# Lead can sync-delegate to all members (and members can respond)
./goclaw teams link research-report \
  --from research_lead --to crawler_specialist \
  --type bidirectional
./goclaw teams link research-report \
  --from research_lead --to fact_check_lead \
  --type bidirectional
./goclaw teams link research-report \
  --from research_lead --to data_analyst \
  --type bidirectional
./goclaw teams link research-report \
  --from research_lead --to technical_writer \
  --type bidirectional
./goclaw teams link research-report \
  --from research_lead --to summary_editor \
  --type bidirectional
```

### Step 8: Set Up Scheduled Tasks (Optional)

```bash
# Morning research brief
./goclaw cron create \
  --agent research_lead \
  --name "morning-brief" \
  --schedule "0 9 * * 1-5" \
  --message "Check research queue. Assign any pending items to team members."

# Nightly fact-check sweep
./goclaw cron create \
  --agent fact_check_lead \
  --name "nightly-verification" \
  --schedule "0 22 * * 0" \
  --message "Run verification sweep on all unverified claims from the past week."
```

### Step 9: Bind to Channel

```bash
./goclaw agents bind research_lead --channel telegram --chat-id YOUR_CHAT_ID
```

### Step 10: Verify

```bash
./goclaw agents list
./goclaw teams list
./goclaw agents get research_lead
```

---

## Pack-Specific Tool Configuration

### DevOpsCorp

```bash
# Lead: orchestrator
./goclaw agents update orchestrator \
  --tools team_tasks,spawn,memory_search,cron,exec

# Execution tracks
./goclaw agents update sub1 --tools team_tasks,exec,read_file,write_file
./goclaw agents update sub2 --tools team_tasks,exec,read_file,write_file
./goclaw agents update sub3 --tools team_tasks,read_file,write_file

# Reviewers
./goclaw agents update reviewer --tools team_tasks,memory_search
./goclaw agents update compliance_auditor --tools team_tasks,memory_search
./goclaw agents update security_architect --tools team_tasks,memory_search

# Data & testing
./goclaw agents update data_engineer --tools team_tasks,memory_search
./goclaw agents update test_automation --tools team_tasks,exec
```

### Review Desk

```bash
./goclaw agents update review_lead --tools team_tasks,spawn,memory_search,cron
./goclaw agents update technical_reviewer --tools team_tasks,memory_search,exec
./goclaw agents update compliance_reviewer --tools team_tasks,memory_search
./goclaw agents update style_guide_enforcer --tools team_tasks,memory_search,read_file
./goclaw agents update quality_assurance --tools team_tasks,memory_search,exec
./goclaw agents update feedback_curator --tools team_tasks,memory_search
```

### Financial Analyst

```bash
./goclaw agents update finance_lead --tools team_tasks,spawn,memory_search,cron
./goclaw agents update market_researcher --tools team_tasks,web_search,web_fetch,memory_search
./goclaw agents update quantitative_analyst --tools team_tasks,memory_search,exec
./goclaw agents update risk_assessor --tools team_tasks,memory_search,exec
./goclaw agents update finance_report_writer --tools team_tasks,memory_search,read_file,write_file
./goclaw agents update data_visualizer --tools team_tasks,memory_search,read_file
```

### Second Brain

```bash
./goclaw agents update orchestrator_agent --tools team_tasks,spawn,memory_search,knowledge_graph_search,cron
./goclaw agents update capture_agent --tools team_tasks,memory_search,read_file
./goclaw agents update tagger_agent --tools team_tasks,memory_search,knowledge_graph_search
./goclaw agents update memory_writer_agent --tools team_tasks,memory_search,write_file
./goclaw agents update search_agent --tools team_tasks,memory_search,knowledge_graph_search
./goclaw agents update recall_agent --tools team_tasks,memory_search,knowledge_graph_search
./goclaw agents update synthesis_agent --tools team_tasks,memory_search,knowledge_graph_search
```

---

## Team Task Board Workflow

The shared task board replaces Discord channel routing. Here's how each pack uses it:

### Research Report: Async Pipeline

```
research_lead creates task → "Research: [topic]"
  blocked_by: none
  priority: high

crawler_specialist claims task
  → delivers sources → marks task complete
  → subtask created: "Fact-check: [claim list]"
    blocked_by: parent task
    assigned to: fact_check_lead
  → subtask created: "Analyze: [data points]"
    blocked_by: parent task
    assigned to: data_analyst

fact_check_lead + data_analyst complete subtasks
  → subtask created: "Draft: [section]"
    assigned to: technical_writer

technical_writer drafts
  → subtask created: "Final edit: [doc]"
    assigned to: summary_editor

summary_editor approves → research_lead delivers final report
```

### Review Desk: Parallel Review + Gate

```
review_lead creates task → "Review: [PR #42]"
  reviewer_assignment: [technical, compliance, style]

  parallel subtasks created:
    technical_reviewer: "Code review: [PR #42]"
    compliance_reviewer: "Compliance review: [PR #42]"
    style_guide_enforcer: "Style review: [PR #42]"
    quality_assurance: "QA check: [PR #42]"

  All complete → subtask: "Synthesize feedback"
    assigned to: feedback_curator

  feedback_curator delivers synthesized feedback
  review_lead issues verdict (PASS/FAIL)
```

### Delegation Patterns

**Sync (lead waits):**
```
research_lead → sync delegate → fact_check_lead: "Quick: Is [claim] verified?"
fact_check_lead responds → research_lead continues
```

**Async (lead moves on):**
```
research_lead → async delegate → crawler_specialist: "Deep research on [topic]"
crawler_specialist announces result via announce_queue
research_lead picks up and synthesizes
```

Use sync for quick lookups, async for long-running research.

---

## Troubleshooting

### Agent not responding to team messages

```bash
# Check delegation links exist
./goclaw teams links research-report

# Check agent tools include team_tasks
./goclaw agents get crawler_specialist | grep tools

# Check team membership
./goclaw teams list | grep crawler_specialist
```

### Context files not loading

```bash
# View current context files
./goclaw agents get research_lead | grep context_files

# Re-inject
./goclaw agents update research_lead --context-files /path/to/files/
```

### Team tasks not visible to members

The lead's `TEAM.md` is auto-generated at runtime. Members see tasks via the `team_tasks` tool. Verify the tool is enabled:

```bash
./goclaw agents get crawler_specialist | grep tools
# Should include: team_tasks
```

### Memory not persisting across sessions

GoClaw memory lives in PostgreSQL. Check DB connection:

```bash
curl http://localhost:18790/health | grep database
```

For Lite (SQLite): memory is per-session only. For full Gateway: memory persists.

---

## Quick-Deploy All Packs

A script to deploy any pack in one shot:

```bash
#!/bin/bash
# deploy-pack.sh <pack_name>
# Example: ./deploy-pack.sh research_report

PACK=$1
TEAM_NAME="${PACK}"
AGENTS_FILE="templates/samples/${PACK}/.agents"

# Read agent names and deploy
while IFS= read -r agent; do
  ./goclaw agents add --name "$agent" --provider anthropic
  ./goclaw agents update "$agent" --context-files "templates/samples/${PACK}/${agent}/"
done < "$AGENTS_FILE"

# Create team with first agent as lead
FIRST=$(head -1 "$AGENTS_FILE")
shift
./goclaw teams create --name "$TEAM_NAME" --lead "$FIRST"
./goclaw teams add "$TEAM_NAME" --agents $(tr '\n' ' ' < "$AGENTS_FILE" | cut -d' ' -f2-)
```

Place an `.agents` file in each pack directory listing agent names (one per line) to use this.

---

## Next Steps

- **[GOCLAW_SETUP.md](GOCLAW_SETUP.md)** — Full GoClaw setup reference
- **[docs.goclaw.sh/#teams-what-are-teams](https://docs.goclaw.sh/#teams-what-are-teams)** — Official team docs
- **[docs.goclaw.sh/#skills](https://docs.goclaw.sh/#skills)** — Building pack-specific skills
- **[docs.goclaw.sh/#scheduling-cron](https://docs.goclaw.sh/#scheduling-cron)** — Cron for pack automation

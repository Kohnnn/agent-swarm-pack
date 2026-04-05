# Research Report Pack

**Use case:** Conduct thorough research — from raw data collection through fact-checking, analysis, and a polished final report.

## The Promise

Give the team a research question. Get a complete, cited, fact-checked, and polished report. The crawler harvests, the fact-checker verifies, the analyst interprets, writers draft, and the editor polishes.

## Agent Roster

| Agent | Brain Name | Role | Responsibility |
|-------|-----------|------|---------------|
| `research_lead` | — | Director | Coordinates workflow, assigns tasks, synthesizes final report |
| `crawler_specialist` | The Senses | Data Harvester | Web scraping, API querying, source identification |
| `fact_check_lead` | The Hippocampus | Truth Guardian | Claim verification, confidence levels, source validation |
| `data_analyst` | — | Interpreter | Statistical analysis, pattern detection, data visualization prep |
| `technical_writer` | — | Translator | Drafts sections from verified findings |
| `summary_editor` | The Prefrontal Cortex | Polisher | Final formatting, style consistency, release gate |

## How It Works

### Research Pipeline

```
research_lead (intake + planning)
        ↓
crawler_specialist → sources + raw data
        ↓
fact_check_lead → verified claims + confidence levels
        ↓
data_analyst → statistical analysis + patterns
        ↓
technical_writer → drafted sections
        ↓
summary_editor → polished final report
        ↓
research_lead → delivery
```

### Source Quality Tiers

| Tier | Source | Trust |
|------|-------|-------|
| 1 | Peer-reviewed, official databases | High |
| 2 | Established news, industry reports | Medium-High |
| 3 | Blogs, white papers, press releases | Medium |
| 4 | Forums, social media, unverified | Low |

### Claim Confidence Levels

- **VERIFIED** — 2+ independent sources confirm
- **UNVERIFIED** — No confirmation, no contradiction
- **DISPUTED** — Sources conflict
- **FALSE** — Primary source evidence contradicts claim

## Typical Usage

### Submit a Research Request

In `#inbox-user` (via orchestrator), send:
```
Research the impact of remote work trends on enterprise software adoption in 2025
```

### What Gets Produced

- Source list with URLs, dates, and tier ratings
- Verified claims with citations
- Statistical analysis with confidence intervals
- Draft report sections
- Final polished report with executive summary

### Briefing Flow

If you need a quick briefing instead of a full report, say:
```
Brief me on VNM's valuation before my call
```
The team will run search + fact-check + analysis in a compressed flow.

## Output Format (Final Report)

```
## Executive Summary
[1-3 sentence conclusion first]

## Key Findings
[3-5 bullet points]

## Detailed Analysis
[Methodology, data, findings]

## Limitations
[Caveats and gaps]

## Conclusion
[So what + next steps]
```

## Key Rules

- No claim enters the report without fact_check_lead verification
- No section is final until summary_editor approval
- research_lead owns the final delivery — not the individual agents
- All claims must be cited with source, date, and confidence level

---

## GoClaw Team Deployment

Deploy this pack as a GoClaw agent team with shared task board and mailbox.

### 1. Create the team

```bash
goclaw team create research-swarm
```

### 2. Create and add agents

```bash
goclaw agents create research_lead --team research-swarm --role lead
goclaw agents create crawler_specialist --team research-swarm
goclaw agents create fact_check_lead --team research-swarm
goclaw agents create data_analyst --team research-swarm
goclaw agents create technical_writer --team research-swarm
goclaw agents create summary_editor --team research-swarm
```

### 3. Inject context files

```bash
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  goclaw agents inject $agent --path templates/samples/research_report/$agent/
done
```

### 4. Inject shared files

```bash
for agent in research_lead crawler_specialist fact_check_lead data_analyst technical_writer summary_editor; do
  goclaw agents inject $agent --path templates/samples/shared/USER.md --target USER.md
  goclaw agents inject $agent --path templates/samples/shared/TOOLS.md --target TOOLS.md
done
```

### 5. Configure delegation links

```bash
goclaw team link research-swarm --from research_lead --to crawler_specialist
goclaw team link research-swarm --from research_lead --to fact_check_lead
goclaw team link research-swarm --from research_lead --to data_analyst
goclaw team link research-swarm --from research_lead --to technical_writer
goclaw team link research-swarm --from research_lead --to summary_editor
```

### 6. Bind to channel

```bash
goclaw channels bind research-swarm --channel telegram:@YourResearchBot
```

### 7. Set up cron (optional)

```bash
goclaw cron create --agent research_lead --schedule "0 9 * * 1" --task "Check team tasks and report status"
```

For full details on team task board workflow, delegation patterns, and per-pack tool configuration, see [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md).

---

## Internal Task Board Workflow

When GoClaw team task board is active, the research pipeline maps to tasks:

| Stage | Task | Owner |
|-------|------|-------|
| Intake | `research: intake + plan` | `research_lead` |
| Collect | `research: crawl sources` | `crawler_specialist` |
| Verify | `research: fact-check claims` | `fact_check_lead` |
| Analyze | `research: analyze data` | `data_analyst` |
| Draft | `research: draft sections` | `technical_writer` |
| Polish | `research: final review` | `summary_editor` |
| Deliver | `research: deliver report` | `research_lead` |

research_lead creates and assigns tasks via the `team_tasks` tool. Members pick up tasks from the shared board and deliver via `team_tasks complete`. Async delegation happens through the team mailbox.

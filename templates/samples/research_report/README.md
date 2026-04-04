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

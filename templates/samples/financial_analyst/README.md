# Financial Analyst Pack

**Use case:** Full-cycle financial intelligence — from market research and data analysis through risk assessment and a decision-ready report.

## The Promise

Ask a financial question. Get a structured answer grounded in data, tested for risk, and delivered as a clean briefing. Market researchers gather, analysts model, risk assessors stress-test, and the report writer makes it decision-ready.

## Agent Roster

| Agent | Brain Name | Role | Responsibility |
|-------|-----------|------|---------------|
| `finance_lead` | — | Strategist | Coordinates workflow, sets priorities, delivers final intelligence |
| `market_researcher` | The Frontal Lobe | Scout | Market conditions, competitive landscape, economic indicators |
| `quantitative_analyst` | — | Model Builder | Statistical modeling, pattern analysis, correlation studies |
| `risk_assessor` | The Hippocampus | What-If Machine | Scenario analysis, stress tests, risk matrices |
| `finance_report_writer` | The Temporal Lobe | Storyteller | Narrative drafting, executive summaries, briefings |
| `data_visualizer` | — | Visual Translator | Charts, dashboards, presentation-ready visuals |

## How It Works

### Analytical Pipeline

```
finance_lead (intake + scope)
        ↓
market_researcher ──→ market context + data
        ↓
quantitative_analyst ──→ models + patterns
        ↓
risk_assessor ──→ scenarios + risk matrix
        ↓
data_visualizer ──→ charts + dashboards
        ↓
finance_report_writer ──→ narrative + briefing
        ↓
finance_lead ──→ delivery
```

### Work Product Per Agent

| Agent | Delivers |
|-------|---------|
| market_researcher | Market brief: conditions, trends, competitive landscape, sources |
| quantitative_analyst | Statistical analysis with confidence intervals, model validation |
| risk_assessor | Risk matrix, scenario analysis (base/bull/bear/stress), VaR |
| finance_report_writer | Executive summary, key findings, recommendations |
| data_visualizer | Charts, graphs, dashboards with source citations |

## Analytical Framework

### Confidence Levels

| Level | Definition | Communication |
|-------|-----------|---------------|
| HIGH | Multiple models agree, robust data | "We recommend..." |
| MEDIUM | Models suggest, data limited | "Evidence suggests..." |
| LOW | Inconclusive, high uncertainty | "Cannot determine..." |

### Risk Metrics Covered

- **VaR** (Value at Risk) — maximum expected loss at X% confidence
- **CVaR** (Conditional VaR) — expected loss beyond VaR threshold
- **Sharpe Ratio** — risk-adjusted return
- **Beta** — market sensitivity
- **Scenario stress tests** — base, bull, bear, stress, tail cases

## Briefing Output Format

```
## [Financial Recommendation / Question]

### Summary
[1-3 sentence conclusion]

### Key Evidence
- <fact 1 with source>
- <fact 2 with source>

### Risk Assessment
- Risk level: LOW / MEDIUM / HIGH / CRITICAL
- Key scenarios modeled

### Assumptions
- <assumption 1>
- <assumption 2>

### Alternatives Considered
- <alternative 1>
- <alternative 2>

### Recommendation
[What to do]
```

## Typical Usage

### Submit a Financial Question

```
What's the risk profile of increasing our VNM position by 20%?
```

### Get a Briefing

```
Summary: Moderate-high risk. VNM shows strong fundamentals but valuation is at historical highs.
Key Evidence: Q4 earnings beat estimates, but P/E is 2 standard deviations above mean.
Risk Assessment: HIGH — VaR (95%) indicates potential 12-18% drawdown in bear case.
Recommendation: Consider staged entry or hedging with options.
```

## Key Rules

- Never claim certainty you don't have — acknowledge uncertainty explicitly
- Risk is personal — what one person tolerates another cannot
- Quantitative models are maps, not territory — always note limitations
- finance_lead owns the final recommendation — not individual analysts
- Market data is only as good as its source — always cite

---

## GoClaw Team Deployment

Deploy this pack as a GoClaw agent team with shared task board and mailbox.

### 1. Create the team

```bash
goclaw team create finance-analyst
```

### 2. Create and add agents

```bash
goclaw agents create finance_lead --team finance-analyst --role lead
goclaw agents create market_researcher --team finance-analyst
goclaw agents create quantitative_analyst --team finance-analyst
goclaw agents create risk_assessor --team finance-analyst
goclaw agents create finance_report_writer --team finance-analyst
goclaw agents create data_visualizer --team finance-analyst
```

### 3. Inject context files

```bash
for agent in finance_lead market_researcher quantitative_analyst risk_assessor finance_report_writer data_visualizer; do
  goclaw agents inject $agent --path templates/samples/financial_analyst/$agent/
done
```

### 4. Inject shared files

```bash
for agent in finance_lead market_researcher quantitative_analyst risk_assessor finance_report_writer data_visualizer; do
  goclaw agents inject $agent --path templates/samples/shared/USER.md --target USER.md
  goclaw agents inject $agent --path templates/samples/shared/TOOLS.md --target TOOLS.md
done
```

### 5. Configure delegation links

```bash
goclaw team link finance-analyst --from finance_lead --to market_researcher
goclaw team link finance-analyst --from finance_lead --to quantitative_analyst
goclaw team link finance-analyst --from finance_lead --to risk_assessor
goclaw team link finance-analyst --from finance_lead --to finance_report_writer
goclaw team link finance-analyst --from finance_lead --to data_visualizer
```

### 6. Bind to channel

```bash
goclaw channels bind finance-analyst --channel telegram:@YourFinanceBot
```

For full details on team task board workflow, delegation patterns, and per-pack tool configuration, see [GOCLAW_PACKS.md](../../GOCLAW_PACKS.md).

---

## Internal Task Board Workflow

When GoClaw team task board is active:

| Stage | Task | Owner |
|-------|------|-------|
| Intake | `finance: scope question` | `finance_lead` |
| Research | `finance: market research` | `market_researcher` |
| Model | `finance: statistical modeling` | `quantitative_analyst` |
| Risk | `finance: risk scenarios` | `risk_assessor` |
| Visualize | `finance: create charts` | `data_visualizer` |
| Write | `finance: draft briefing` | `finance_report_writer` |
| Deliver | `finance: deliver report` | `finance_lead` |

finance_lead creates the task chain and assigns sequentially or in parallel where independence allows. risk_assessor runs after quantitative_analyst has models ready. data_visualizer works alongside finance_report_writer.

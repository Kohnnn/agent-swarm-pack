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

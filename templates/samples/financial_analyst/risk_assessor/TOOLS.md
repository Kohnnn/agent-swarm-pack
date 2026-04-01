# TOOLS.md - Risk Assessor Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Risk Framework

### Types of Financial Risk
- Market risk (price movements)
- Credit risk (counterparty default)
- Liquidity risk (unable to exit)
- Operational risk (process/system failure)
- Regulatory risk (policy changes)

### Risk Metrics
| Metric | Description | Use Case |
|--------|-------------|----------|
| VaR | Value at Risk - max loss at X% confidence | Standard risk reporting |
| CVaR | Conditional VaR - expected loss beyond VaR | Tail risk assessment |
| Sharpe Ratio | Risk-adjusted return | Performance comparison |
| Sortino Ratio | Downside risk-adjusted return | Asymmetric returns |
| Beta | Market sensitivity | Equity risk |

## Scenario Framework

### Scenario Types
1. **Base case:** Most likely outcome
2. **Bull case:** Upside scenario
3. **Bear case:** Downside scenario
4. **Stress case:** Extreme but plausible
5. **Tail case:** Low probability, high impact

### Scenario Template
```
Scenario: <name>
Probability: <X%>
Trigger: <what causes this>
Impact:
- Best case: <return>
- Expected case: <return>
- Worst case: <return>
Time Horizon: <when>
Key Assumptions: <list>
```

## Risk Assessment Template

```
Risk Assessment
===============

Position/Scenario: <what we're assessing>
Risk Types: <market/credit/liquidity/etc.>

Risk Metrics:
- VaR (95%): <value>
- CVaR (95%): <value>
- Beta: <value>

Key Risks:
1. <risk> - <probability> - <impact>
2. <risk> - <probability> - <impact>

Stress Test Results:
- <scenario>: <result>

Risk-Adjusted Assessment:
- Risk level: <LOW|MEDIUM|HIGH|CRITICAL>
- Recommendation: <mitigation or acceptance>
```

## Risk Tolerance Guide

| Tolerance | Characteristics | Risk Approach |
|-----------|-----------------|---------------|
| Conservative | Capital preservation priority | Minimize volatility, accept lower returns |
| Moderate | Balanced | Risk-return tradeoff acceptable |
| Aggressive | Growth priority | Accept higher volatility for upside potential |

## Routing Reminders

- Statistical models → quantitative_analyst
- Market data → market_researcher
- Strategic synthesis → finance_lead
- Visualization → data_visualizer

## Guardrail Reminder

Assess, don't decide. Risk is input to strategy. Present scenarios and probabilities, let finance_lead make the call.

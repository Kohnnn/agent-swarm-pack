# TOOLS.md - Quantitative Analyst Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Statistical Standards

| Analysis Type | Minimum Output |
|---------------|----------------|
| Descriptive | n, mean, median, std dev, range, quartiles |
| Correlation | r, n, p-value, confidence interval |
| Regression | coefficients, R², F-stat, p-values |
| Time series | trend, seasonality, forecast intervals |
| Hypothesis test | test statistic, p-value, effect size |

## Model Validation Checklist

- [ ] Theoretical justification for model choice
- [ ] Data quality verified (no obvious errors)
- [ ] Outliers identified and justified
- [ ] Assumptions checked (linearity, normality, etc.)
- [ ] Out-of-sample validation performed
- [ ] Sensitivity analysis completed
- [ ] Limitations documented

## Confidence Level Guide

| Level | Statistical Basis | Communication |
|-------|-------------------|---------------|
| HIGH | p < 0.01, large n, robust model | "statistically significant" |
| MEDIUM | p < 0.05, adequate n | "suggests" |
| LOW | p < 0.10 or small n | "may indicate, further research needed" |
| UNCERTAIN | High variance, model limitations | "inconclusive" |

## Common Pitfalls

- **Overfitting:** Model too complex for data
- **Underfitting:** Model too simple to capture signal
- **Multicollinearity:** Correlated predictors inflate variance
- **Survivorship bias:** Ignoring failed cases
- **Hindsight bias:** Treating past predictions as certain

## Model Documentation Template

```
Model: <name>
Type: <regression/classification/time series/etc.>
Purpose: <what it answers>
Data: <source, time period, n>
Variables: <dependent and independent>
Key Assumptions:
- <assumption 1>
- <assumption 2>
Validation Results:
- <validation metric 1>
- <validation metric 2>
Limitations:
- <limitation 1>
- <limitation 2>
```

## Routing Reminders

- Market context → market_researcher
- Risk scenarios → risk_assessor
- Strategic synthesis → finance_lead
- Visualization → data_visualizer

## Guardrail Reminder

Model, don't recommend. Present findings and limitations, let finance_lead make strategic calls.

# TOOLS.md - Data Analyst Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Analysis Framework

### Before Analysis
1. Verify data integrity (missing values, outliers, duplicates)
2. Understand data schema and definitions
3. Note sample size and representativeness
4. Identify confounding variables

### During Analysis
1. Use appropriate statistical methods
2. Calculate confidence intervals
3. Test for significance
4. Document all assumptions

### After Analysis
1. Validate against domain knowledge
2. Check for alternative explanations
3. Note limitations
4. Prepare visualization-friendly outputs

## Statistical Standards

| Analysis Type | Minimum Standard |
|---------------|-------------------|
| Descriptive stats | n, mean/median, std dev, range |
| Comparisons | p-value or confidence interval |
| Correlations | r value, n, p-value |
| Trends | R-squared, confidence interval |
| Predictions | Model validation, error margins |

## Data Quality Checklist

- [ ] Missing values < 5% or handled explicitly
- [ ] Outliers identified and justified
- [ ] Sample size adequate for intended analysis
- [ ] No obvious data entry errors
- [ ] Units consistent throughout
- [ ] Time periods clearly defined

## Confidence Level Guide

| Confidence | When to Use |
|------------|-------------|
| HIGH | Multiple sources, large n, low variance |
| MEDIUM | Single source or moderate n |
| LOW | Small sample, high variance, novel analysis |
| UNCERTAIN | Exploratory only; needs validation |

## Visualization Standards

- All charts need: title, axis labels, source note, sample size
- Pie charts: only for < 6 categories that sum to 100%
- Bar charts: zero-origin preferred
- Line charts: clearly label series, note gaps
- Maps: projection noted, data source cited

## Routing Reminders

- Raw data issues → crawler_specialist for re-extraction
- Verification questions → fact_check_lead
- Methodology questions → research_lead
- Narrative interpretation → technical_writer

## Guardrail Reminder

Never claim causation from correlation. Flag when you're extrapolating beyond the data.

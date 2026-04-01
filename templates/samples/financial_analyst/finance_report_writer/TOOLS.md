# TOOLS.md - Finance Report Writer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Report Structure Framework

### Standard Financial Report Structure
1. **Executive Summary** (conclusion first, 1 page max)
2. **Key Findings** (3-5 bullet points)
3. **Detailed Analysis** (methodology, data, findings)
4. **Risk Assessment** (from risk_assessor)
5. **Recommendations** (actionable next steps)
6. **Appendix** (detailed data, methodology)

### Audience Adaptation
| Audience | Tone | Complexity | Length |
|----------|------|------------|--------|
| C-Suite | Strategic, minimal jargon | Low | Short |
| Board | Summary, moderate detail | Medium | Medium |
| Analysts | Full methodology | High | Long |
| Investors | Performance-focused | Medium | Medium |

## Translation Guide

| Instead of... | Say... |
|---------------|--------|
| EBITDA | Cash generated from operations |
| ROIC | Return on invested capital |
| Correlation | When X moves, Y tends to move |
| Volatility | How much the value swings |
| Liquidity | How easily you can convert to cash |

## Writing Checklist

- [ ] Executive summary captures key conclusions
- [ ] All claims traced to team outputs
- [ ] Jargon defined on first use
- [ ] Numbers have context (vs. what? since when?)
- [ ] Risk clearly communicated
- [ ] Recommendations are actionable
- [ ] Report flows logically

## Citation Format

```
Finding: <what>
Source: <analyst/analysis type>
Confidence: <HIGH|MEDIUM|LOW>
Date: <analysis date>
```

## Common Pitfalls

- **Analysis paralysis:** Don't over-explain — recommend
- **Jargon overdose:** If a term needs a footnote, find a simpler word
- **Cherry-picking:** Show the full picture, not just favorable data
- **Past tense vs present:** "grew 10%" vs "is growing 10%" vs "expected to grow 10%"

## Routing Reminders

- Statistical questions → quantitative_analyst
- Risk questions → risk_assessor
- Market context → market_researcher
- Strategic synthesis → finance_lead

## Guardrail Reminder

Translate, don't interpret. Report what the analysis says, not what you think it means.

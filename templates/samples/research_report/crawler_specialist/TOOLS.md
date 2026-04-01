# TOOLS.md - Crawler Specialist Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Search Strategy Framework

Before crawling, establish:
1. **Scope:** What exactly needs to be found?
2. **Sources:** Which databases/APIs/sites are in scope?
3. **Tiers:** Which sources are high-trust vs need verification?
4. **Format:** How should extracted data be structured?

## Source Documentation Template

```
Source: <name>
URL: <link>
Accessed: <date>
Tier: <1-4>
Legal Status: <public/robots.txt compliant/paywalled/ambiguous>
Extracted: <what was pulled>
Gaps: <what's missing>
```

## Rate Limit Guidelines

- Standard websites: 1 req/sec max
- APIs: respect individual rate limits
- Burst crawling: never exceed 10 req/sec sustained
- If blocked: log, wait, retry with backoff

## Legal Boundaries

- Respect robots.txt unless research purpose justifies override
- Never bypass paywalls
- Document all access for reproducibility
- When in doubt, escalate

## Output Formats by Data Type

| Data Type | Format |
|-----------|--------|
| Text snippets | Quote + URL + date |
| Statistics | Value + source + methodology note |
| Dates/events | Event + date + source |
| Images | Alt text + source URL + license note |
| Data sets | File + schema + source |

## Routing Reminders

- All extracted claims go to fact_check_lead queue
- Raw data goes to data_analyst for processing
- Source gaps go to research_lead for strategy adjustment

## Guardrail Reminder

Do not claim a source is "reliable" — that determination belongs to fact_check_lead. You document; you don't verify.

# TOOLS.md - Search Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Semantic Search Principles

- Match meaning, not strings
- Expand queries with synonyms and related concepts
- Consider context of the user question
- Weight recency and relevance equally

## Query Expansion Example

User asks: "VNM valuation last quarter"

Expanded search includes:
- "VNM" + "valuation" + "quarterly" + "financial" + "performance" + "Q1 2026"
- Also check: "VNM earnings", "VNM revenue", "VNM financial results"

## Result Ranking Factors

| Factor | Weight | Notes |
|--------|--------|-------|
| Semantic relevance | HIGH | Meaning matches query intent |
| Entity match | HIGH | Same person/company/project named |
| Recency | MEDIUM | Newer memories slightly weighted |
| Confidence tag | MEDIUM | HIGH confidence items ranked higher |
| Memory type | LOW | durable > process > transient for reference queries |

## Result Annotation Template

```
Memory: <title>
Drawer: <drawer>
Date: <YYYY-MM-DD>
Relevance: <HIGH/MEDIUM/LOW>
Relevance Notes: <why this matches>
Key Extract: <2-3 sentences from memory>
```

## Output Limit Guidelines

| Query Type | Max Results |
|------------|-------------|
| Direct question | Top 5 |
| Briefing prep | Top 8 |
| General exploration | Top 10 |
| Thorough review | Top 15 |

Always include a "gaps noted" line if fewer than 3 results are found.

## Gaps Flag Format

```
Gaps:
- No memories found about: <topic>
- Possible missing context: <what might be relevant but unfound>
- Suggestion: <how to fill the gap>
```

## Routing Reminders

- Always hand results to synthesis_agent for final output
- Return at minimum the top 3 results
- Annotate each result with relevance reasoning

## Guardrail Reminder

Retrieve meaning, not strings. Rank by relevance, not just date. Annotate your reasoning so synthesis_agent can weight results.

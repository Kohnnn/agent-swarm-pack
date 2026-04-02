# TOOLS.md - Recall Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Date Parsing Guide

| Query | Interpretation |
|-------|----------------|
| "last week" | Previous 7 days from today |
| "this week" | Current week starting Monday |
| "yesterday" | Previous day |
| "3 months ago" | Same date, 3 months back |
| "before that meeting" | Find the meeting, then recall memories after it |
| "around when we decided X" | Find the decision memory, recall memories near that date |
| "last quarter" | Previous fiscal quarter |
| "Q1" | First quarter of current year unless year specified |

## Timeline Output Format

```
Timeline: <period description>
Memories found: <count>

1. <YYYY-MM-DD> — <memory title>
   Source: <drawer>
   Summary: <1-2 sentences>

2. ...

Gaps:
- <periods with no memories>
```

## Gap Flagging Rules

Always note:
- Any significant period (>1 week) with no memories
- Known events the user mentioned but no memories found
- Potential recall failures (should exist but doesn't)

## Recall Quality Notes

- Cross-reference dates across all drawers
- daily_notes is richest for time queries
- decisions and meetings often anchor timelines
- If multiple memories on same date, return all in chronological order

## Period Boundary Behavior

- Start inclusive, end inclusive for most queries
- For "before X date" — exclude the anchor event itself, return what came before
- For "after X date" — include memories from that date forward

## Output Limit

Return all memories in the requested period unless >20. If >20, consolidate to top 20 with note about additional items.

## Routing Reminders

- Always hand timeline to synthesis_agent for final output
- Return memories in chronological order (oldest first unless specified)
- Include date, source drawer, and brief summary for each item

## Guardrail Reminder

Time-based, not topic-based. If both time and topic are specified, prioritize time but tag topic matches for synthesis_agent to weight.

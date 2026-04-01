# TOOLS.md - Feedback Curator Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Feedback Synthesis Framework

### Collection Phase
1. Gather feedback from all reviewers
2. Note source and severity for each item
3. Identify duplicate concerns
4. Flag conflicting feedback

### Organization Phase
1. Group related feedback
2. Prioritize by severity
3. Identify quick wins vs. major changes
4. Separate blocking from non-blocking

### Delivery Phase
1. Start with blockers
2. Group by category
3. Provide specific actionable items
4. Offer to clarify

## Prioritization Matrix

| Priority | Criteria |
|----------|----------|
| MUST FIX | Blocking, CRITICAL/HIGH severity |
| SHOULD FIX | Important but non-blocking, MEDIUM severity |
| NICE TO FIX | Low priority, LOW/NIT severity |
| CONSIDER | Future improvements, long-term |

## Feedback Delivery Template

```
Review Feedback Summary
========================

BLOCKING (Must fix before release):
- [Reviewer] <feedback> (<severity>)
- ...

IMPORTANT (Should fix):
- [Reviewer] <feedback> (<severity>)
- ...

NICE TO HAVE (Consider):
- [Reviewer] <feedback> (<severity>)
- ...

Resolved from previous review:
- <what was fixed>

Questions for clarification:
- <open questions>
```

## Revision Tracking

| Status | Meaning |
|--------|---------|
| PENDING | Feedback delivered, awaiting revision |
| IN_PROGRESS | Creator working on fix |
| RESOLVED | Fix verified by reviewer |
| WON'T_FIX | Agreed to not address (with rationale) |
| ESCALATED | Dispute or conflict requiring resolution |

## Feedback Tone Guide

| Instead of... | Say... |
|---------------|--------|
| "This is wrong" | "Consider revising to address..." |
| "You missed..." | "Reviewer noted that..." |
| "This needs to be fixed" | "Action item: ..." |
| "Multiple reviewers flagged..." | "All reviewers agreed that..." |

## Routing Reminders

- Reviewer conflicts → review_lead
- Technical questions → relevant reviewer
- Process issues → review_lead
- Creator disputes → review_lead for mediation

## Guardrail Reminder

You are the messenger, not the reviewer. Don't add your own opinions, don't change feedback, don't bury the lede.

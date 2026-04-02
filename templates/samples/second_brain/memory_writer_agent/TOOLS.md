# TOOLS.md - Memory Writer Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Memory Type Definitions

| Type | Definition | Example |
|------|-----------|---------|
| transient | One-time, not expected to recur or be referenced | Random thought, passing note, meeting attendance |
| durable | Facts, context, information with long-term value | Person profiles, company notes, project decisions |
| process | Repeatable steps or workflows | SOPs, playbooks, how-to notes |

## Drawer Selection Guide

| Drawer | When to Use |
|--------|------------|
| `daily_notes` | One-time events, transient observations, meeting attendance |
| `reference_knowledge` | Definitions, established facts, how things work |
| `people` | Everything about a specific person |
| `companies` | Everything about a specific company or organization |
| `projects` | Project context, decisions, status, participants |
| `meetings` | Meeting records with attendees and outcomes |
| `ideas` | Seeds of projects, hypotheses, creative sparks |
| `processes` | Repeatable workflows, SOPs, checklists |
| `decisions` | Decisions made + reasoning + date |

## Storage Conflict Resolution

If a memory already exists for the same entity:
1. Check if the new memory updates or contradicts the existing one
2. If update: append to existing with new timestamp, don't replace
3. If new topic: store separately in same drawer
4. Flag conflicts to orchestrator_agent

## File Naming Convention

```
<drawer>/<YYYY-MM-DD>_<entity_or_topic>_<type>.md
```

Examples:
- `daily_notes/2026-04-02_2am-thought.md`
- `people/2026-03-15_jane-doe_contact.md`
- `decisions/2026-03-10_vnm-valuation_yes.md`

## Storage Record Format

```markdown
# Memory Record

**Drawer:** <drawer_name>
**Type:** <transient/durable/process>
**Filed:** <YYYY-MM-DD HH:MM>
**Rationale:** <why this drawer, why this type>

## Content

<full memory content>

## Tags (from Tagger Agent)
<topics, categories, entities>

## Source
<original source reference>

## Relationships
<related memories>
```

## Routing Reminders

- You're the last agent in the capture pipeline
- After you, the memory is filed and retrievable
- Don't receive direct user queries — those go to search/recall

## Guardrail Reminder

Write, don't retrieve. File the memory completely. Never overwrite — append with timestamp instead.

# TOOLS.md - Tagger Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Tag Taxonomy

### Topics (choose all that apply)
- technology, business, personal, health, finance, research, creative, ops, legal, education, news, product, engineering, design, marketing, strategy

### Categories (choose primary + secondary)
- fact, opinion, event, decision, process, reference, idea, question, meeting, project, person, company, concept

### Entity Types
- people (full name or identifier)
- companies (as written)
- projects (as named)
- concepts (technical or domain-specific terms)
- dates (significant dates mentioned)
- metrics (numbers with meaning)

## Confidence Levels

| Level | When to Use |
|-------|-------------|
| HIGH | Clear topic, unambiguous entities, well-written source |
| MEDIUM | Some ambiguity in topic or entities, partial content |
| LOW | Vague content, no clear entities, or very short input |

## Relationship Notes

When tagging, consider:
- Does this relate to an existing person or company in memory?
- Does this extend or contradict a previous note?
- Does this belong to an active project?
- Does this mention a decision that was made?

Format: "Related to: <existing_memory_id or entity_name> — <nature of relationship>"

## Tagging Output Template

```
---
topics: [list]
categories: [primary, secondary]
entities:
  people: [list]
  companies: [list]
  projects: [list]
  concepts: [list]
relationships: [list]
confidence: HIGH/MEDIUM/LOW
confidence_notes: <if MEDIUM or LOW>
---
```

## Routing Reminders

- Always hand full tag output to memory_writer_agent
- If new entity types are discovered, flag for taxonomy expansion
- Don't skip any memory item — even LOW confidence items get tagged

## Guardrail Reminder

Tag, don't file. Attach metadata and hand to memory_writer_agent. Storage is their call.

# TOOLS.md - Capture Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Supported Input Formats

| Format | Handling |
|--------|---------|
| Plain text note | Direct capture, extract title from first line |
| URL/link | Fetch metadata, extract page title and description |
| PDF | Store artifact reference, extract visible text for summary |
| Screenshot | Store artifact reference, OCR text if accessible |
| Voice memo | Store artifact reference, transcript if available |
| Email clip | Store artifact reference, extract sender/subject/body |
| Chat clip | Store artifact reference, extract speaker and content |

## Memory Item Template

```
---
title: <extracted or generated title>
summary: <2-3 sentence summary>
source: <URL or format type>
timestamp: <YYYY-MM-DD HH:MM>
artifact_reference: <path or link to raw file>
confidence: <HIGH/MEDIUM/LOW>
---
```

## Normalization Rules

- Strip formatting noise from pasted text
- Truncate titles at 80 characters
- Summaries max 200 characters
- Always include timestamp in ISO format
- Artifact stored with content hash as filename

## Capture Confirmation Format

```
Captured ✓
Title: <title>
Summary: <summary>
Source: <source>
Timestamp: <timestamp>
→ Handed to Tagger Agent
```

## Routing Reminders

- Always hand to tagger_agent after normalization
- If input is malformed, capture as-is with LOW confidence rather than discarding
- Don't interpret content beyond extraction

## Guardrail Reminder

Capture, don't interpret. Extract fields and hand to tagger_agent. The meaning is not your job.

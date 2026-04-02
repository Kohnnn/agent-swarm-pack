# TOOLS.md - Orchestrator Agent Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Routing Decision Tree

```
User input received
        ↓
Is this a capture? → YES → Route to capture_agent
        ↓ NO
Is this a question/briefing? → YES
        ↓
Call search_agent + recall_agent in parallel
        ↓
Route both outputs to synthesis_agent
        ↓
Return synthesis output to user
```

## Intent Classification Guide

| Input Type | Indicators | Route To |
|------------|-----------|---------|
| Capture | note, link, PDF, voice, "save this", "remember" | capture_agent |
| Topic query | "what do I know about", "tell me about", "everything about" | search_agent → synthesis_agent |
| Time query | "last week", "3 months ago", "before", "when did I" | recall_agent → synthesis_agent |
| Briefing | "before my call", "prep me for", "summarize for" | search_agent + recall_agent → synthesis_agent |
| Mixed capture+query | capture + question in same message | capture_agent first, then query route |

## Agent Call Patterns

### Capture Flow
```
capture_agent → tagger_agent → memory_writer_agent
```
Output: stored memory confirmation

### Question Flow
```
search_agent → synthesis_agent
```
Output: direct answer to user

### Timeline Flow
```
recall_agent → synthesis_agent
```
Output: chronological summary

### Briefing Flow
```
search_agent + recall_agent → synthesis_agent
```
Output: full briefing document

## Routing Reminders

- capture_agent is always first for new inputs
- search and recall can run in parallel when both are relevant
- synthesis_agent is always the last call before user output
- Never return raw agent outputs — only synthesis output

## Guardrail Reminder

Route, don't do. You delegate to other agents. You don't retrieve, recall, or synthesize yourself.

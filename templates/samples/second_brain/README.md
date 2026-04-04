# Second Brain Pack

**Use case:** Turn messy personal knowledge into structured memory — and get useful answers back when you need them.

## The Promise

Drop anything in — a note, a link, a PDF, a voice memo, a 2am thought. It gets captured, tagged, and filed. Ask anything. Get a clean answer, not a pile of raw notes.

## Agent Roster

| Agent | Brain Name | Role | Responsibility |
|-------|-----------|------|---------------|
| `orchestrator_agent` | The Thalamus | Relay Center | Routes every input to the right agents |
| `capture_agent` | The Senses | Intake | Accepts any input, normalizes to memory item |
| `tagger_agent` | The Hippocampus | Indexer | Classifies topics, extracts entities, links relationships |
| `memory_writer_agent` | The Cortex | Archivist | Files memory to the right drawer with right type |
| `search_agent` | The Frontal Lobe | Retriever | Semantic search across all memories |
| `recall_agent` | The Temporal Lobe | Chronicler | Time-based retrieval — "last week", "3 months ago" |
| `synthesis_agent` | The Prefrontal Cortex | Insight | Merges results into a clear, colleague-like answer |

## Brain Flow

```
Senses → Hippocampus → Cortex
                ↓
Frontal Lobe / Temporal Lobe → Prefrontal Cortex
                ↓
         Thalamus (routes everything)
```

## Memory Drawers

| Drawer | Use For |
|--------|---------|
| `daily_notes` | One-time events, transient thoughts, meeting attendance |
| `reference_knowledge` | Durable facts, definitions, established information |
| `people` | Person profiles, interaction history, context |
| `companies` | Company profiles, relationship context |
| `projects` | Project decisions, status, participants |
| `meetings` | Meeting records with attendees and outcomes |
| `ideas` | Seeds of projects, hypotheses, creative thoughts |
| `processes` | Repeatable workflows, SOPs, playbooks |
| `decisions` | Decisions made and the reasoning behind them |

## How It Works

### Capture Flow (Input → Filed Memory)

```
You drop in a note / link / PDF / voice memo
        ↓
capture_agent → extracts title, summary, source, timestamp
        ↓
tagger_agent → classifies topics, categories, entities
        ↓
memory_writer_agent → picks drawer + memory type, writes to storage
        ↓
✅ Memory is filed and retrievable
```

### Query Flow (Question → Answer)

```
You ask: "What do I know about VNM before my call?"
        ↓
orchestrator_agent → classifies intent (briefing)
        ↓
search_agent + recall_agent (parallel)
        ↓
synthesis_agent → merges results into clean briefing
        ↓
✅ One answer, not a stack of raw notes
```

### Timeline Flow (Time Query → Recap)

```
You ask: "What was I thinking about last week?"
        ↓
orchestrator_agent → routes to recall_agent
        ↓
recall_agent → pulls memories in chronological order
        ↓
synthesis_agent → writes a coherent recap
        ↓
✅ Chronological recap, not a list
```

## Memory Item Format

Every filed memory has:

```markdown
---
title: <extracted title>
summary: <2-3 sentence summary>
source: <URL or format type>
timestamp: <YYYY-MM-DD HH:MM>
drawer: <which drawer it lives in>
type: <transient / durable / process>
tags: <topics, categories, entities>
confidence: <HIGH / MEDIUM / LOW>
---
```

## Synthesis Output Format

```
## [Answer to the actual question]

### Key Facts
- <fact 1>
- <fact 2>

### Timeline [if time-based query]
- <date> — <event>

### Notable Gaps
- <things you couldn't find>

### Suggested Follow-ups
- <questions you might want to ask next>
```

## Typical Usage

### Capture Something

```
"Save this: VNM is considering a Series C at $400M valuation — from Jane's email yesterday"
"Remember: the offsite is March 15 at the SF office"
"Add this link: https://example.com/vnm-analysis — interesting take on their Q4 numbers"
```

### Ask a Question

```
"What did I note about VNM's valuation before my call tomorrow?"
"Summarize everything I know about Acme Corp"
"What was I working on last week around the VNM project?"
"Give me a pre-call briefing on Jane Doe"
```

## Why the Brain Metaphor

| Brain Region | Agent | Why It Fits |
|-------------|-------|------------|
| Thalamus | orchestrator_agent | Routes every signal to the right place |
| The Senses | capture_agent | Takes in everything from the outside world |
| Hippocampus | tagger_agent | Indexes and categorizes before storing |
| Cortex | memory_writer_agent | Long-term storage — where memories get filed |
| Frontal Lobe | search_agent | Active retrieval when you need to find something |
| Temporal Lobe | recall_agent | Time-based memory — "what happened when" |
| Prefrontal Cortex | synthesis_agent | Highest reasoning — turns raw recall into clear thought |

## Key Rules

- capture_agent is always open — nothing is too messy or too random
- Every memory gets tagged — untagged memories are black holes
- Never return raw notes — synthesis_agent always writes the final answer
- Be honest about gaps — "I couldn't find anything about X" is more useful than a made-up answer
- orchestrator_agent routes invisibly — the user only sees synthesis_agent's output

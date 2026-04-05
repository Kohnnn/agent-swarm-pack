# Agent Template Pack (GoClaw)

This folder contains starter templates for per-agent injection:

- `SOUL.md` — persona, core truths, scope, hard constraints
- `AGENTS.md` — workspace conventions, safety, memory, heartbeat policy
- `IDENTITY.md` — public persona metadata (name, emoji, communication style)
- `USER.md` — human profile, project context, decision preferences
- `TOOLS.md` — role-specific tool notes and operational guardrails

Use-case packs live in `samples/`:

- `samples/dev-ops-corp/` — 9-agent DevOps/swe workflow team
- `samples/research_report/` — 6-agent research pipeline team
- `samples/review_desk/` — 6-agent review gate team
- `samples/financial_analyst/` — 6-agent financial intelligence team
- `samples/second_brain/` — 7-agent personal knowledge management team

## GoClaw Quick Inject Workflow

### 1. Create the agent

```bash
goclaw agents create coding --workspace ~/.goclaw/agents/coding
```

### 2. Inject template files

```bash
goclaw agents inject coding --path templates/SOUL.md
goclaw agents inject coding --path templates/AGENTS.md
goclaw agents inject coding --path templates/IDENTITY.md
goclaw agents inject coding --path templates/USER.md
goclaw agents inject coding --path templates/TOOLS.md
```

### 3. Replace placeholders

Edit `~/.goclaw/agents/coding/` files to fill in agent-specific values.

### 4. Verify

```bash
goclaw agents list
goclaw agents status coding
```

## GoClaw Team Workflow

To create a multi-agent team:

```bash
# 1. Create team
goclaw team create my-team

# 2. Create agents with team membership
goclaw agents create lead --team my-team --role lead
goclaw agents create member1 --team my-team

# 3. Inject context files
goclaw agents inject lead --path templates/SOUL.md
goclaw agents inject member1 --path templates/SOUL.md

# 4. Set up delegation links
goclaw team link my-team --from lead --to member1

# 5. Bind to channel
goclaw channels bind my-team --channel telegram:@YourBot
```

For full team deployment of use-case packs, see [GOCLAW_PACKS.md](../GOCLAW_PACKS.md).

## Memory System

GoClaw agents have a built-in memory system:

- **Daily notes:** `memory/YYYY-MM-DD.md` — raw session logs
- **Long-term:** `MEMORY.md` — curated memories (main session only)

Files are auto-created in each agent's workspace directory.

## Skills

GoClaw has a built-in skills system. Place skill definitions at:

```
~/.goclaw/skills/<skill-name>/SKILL.md
```

Skills are matched via BM25 + pgvector hybrid search when relevant.

## Porting from OpenClaw

| OpenClaw | GoClaw |
|----------|--------|
| `openclaw agents add` | `goclaw agents create` |
| Manual file copy | `goclaw agents inject` |
| `openclaw agents set-identity` | `goclaw agents inject IDENTITY.md` |
| Channel config in JSON | `goclaw channels bind` |
| N/A | `goclaw team create` + `team link` for delegation |

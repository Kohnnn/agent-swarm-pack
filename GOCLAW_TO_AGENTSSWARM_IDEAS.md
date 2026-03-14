# GoClaw Inspired Features for AgentsSwarm

After analyzing the `goclaw` architecture (a multi-agent AI gateway written in Go) and comparing it to `AgentsSwarm` (a chat-first frontend and runtime written in TypeScript/React), several high-impact features and patterns stand out. These can be adapted into `AgentsSwarm` to elevate its agent orchestration and user experience without compromising its lightweight nature.

---

## 1. The Evaluate Loop (Generator-Evaluator Cycle)
**Concept from GoClaw:** The `evaluate_loop` orchestrates a generator-evaluator feedback cycle between two agents for quality-gated output. An agent generates output, a reviewer checks it against criteria, and if rejected, passes feedback back to the generator for revision (up to a max configured rounds).
**Adaptation for AgentsSwarm:** 
- In the new React SPA, we currently have visual role tags (`COORD`, `BLD`, `SCT`, `RVW`). We can formalize the `RVW` (Reviewer) role into an autonomous loop. 
- When an agent finishes a task, instead of stopping and waiting for the *user* to act as QA, the system automatically sequences a configured "Reviewer Agent" to explicitly pass/fail the output.
- **UI Impact:** The chat timeline could visually collapse these inner critique cycles into a single "Reviewing..." step, only showing the final approved answer (or the back-and-forth if the user expands it), just like the new Run Transcripts polish in Paperclip.

## 2. Quality Gates & Hooks
**Concept from GoClaw:** Output validation before it reaches the user. For instance, testing a command's exit code or running a quick lint/check. 
**Adaptation for AgentsSwarm:**
- Since AgentsSwarm executes local tasks (e.g., via `node --test`), we can implement explicit `Quality Gates` configuration per agent. 
- E.g., before an agent is allowed to finalize a "Write React Component" task, the framework implicitly runs `npm run lint` and `npm run test`. If it fails, the agent is automatically fed the error and forced to retry without user intervention.

## 3. Explicit Handoff vs. Delegation
**Concept from GoClaw:** Clear distinction between:
- **Sync Delegation:** Agent A asks Agent B and *waits* for the answer.
- **Async Delegation:** Agent A asks Agent B and *moves on*. B announces the result later.
- **Handoff:** Agent A transfers the entire conversation control to Agent B explicitly.
**Adaptation for AgentsSwarm:**
- We can map these explicitly to our UI. When an agent tags another using `@`, we can let the agent specify whether they are waiting for a fast answer (Sync) or generating a long-running background task (Async) via a tool call.
- Async tasks could spawn a side-panel or "Task Board" (like GoClaw's Agent Teams task board) in the Dashboards view, so the user knows parallel work is happening without cluttering the main conversation stream.

## 4. SKILL.md for Pluggable Tools
**Concept from GoClaw:** Dropping a folder with a `SKILL.md` (YAML frontmatter + markdown instructions) instantly registers a new tool/capability hybrid.
**Adaptation for AgentsSwarm:**
- AgentsSwarm can adopt this literal file format. If a user wants to teach AgentsSwarm a new capability, they just create a folder with a `SKILL.md`. 
- Our runtime reads this markdown, uses the YAML for the JSON-schema tool definition, and injects the markdown text as the "how-to" context when the agent selects that tool. This provides a unified standard across Claw-Empire, GoClaw, and AgentsSwarm for tool portability.

## 5. Lane-based Execution Scheduler
**Concept from GoClaw:** Categorizing concurrency constraints into separate "lanes" (main chat, subagents, delegations, background cron jobs).
**Adaptation for AgentsSwarm:**
- To prevent heavy local tasks or too many parallel agents from freezing the Node event loop or hitting rate limits on the LLM APIs, a simple Queue system can be implemented in `board-render.js` / API routes.
- Limit max concurrency for sub-agents (e.g., max 3 active tool-calls at once) while prioritizing the "Main" lane (user chat messages).

## 6. Prompt Caching Awareness
**Concept from GoClaw:** Native integration with Anthropic `cache_control` and OpenAI-compatible caching to reduce costs on repeated System Prompts.
**Adaptation for AgentsSwarm:**
- With the Agent Packs bringing more context, applying explicit `ephemeral` caching anchors in the TS codebase when generating the `messages` array for Anthropic or DeepSeek will save significant token costs and speed up response times for long-running AgentSwarm sessions.

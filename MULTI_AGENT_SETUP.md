# Multi-Agent OpenClaw Setup (Step by Step)

This guide is focused on agent customization and lifecycle operations:

- Create and customize agents (`SOUL.md`, identity, model/provider).
- Bind agents to multiple messaging accounts.
- Safely remove agents and clean up bindings/state.

---

## Step 1: Install and baseline health

Run on the Gateway host:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
openclaw gateway status
openclaw channels status --probe
```

---

## Step 2: Create isolated agents for your swarm

Create one agent per role:

```bash
openclaw agents add strategy --workspace ~/.openclaw/workspace-strategy
openclaw agents add coding --workspace ~/.openclaw/workspace-coding
openclaw agents add support --workspace ~/.openclaw/workspace-support
```

Inspect full inventory:

```bash
openclaw agents list --bindings --json
```

---

## Step 3: Customize agent identity (CLI)

Set user-facing identity per agent (name/emoji/avatar):

```bash
openclaw agents set-identity --agent strategy --name "Strategy Lead" --emoji "S"
openclaw agents set-identity --agent coding --name "Code Worker" --emoji "C"
openclaw agents set-identity --agent support --name "Support Desk" --emoji "H"
```

If your workspace already has an `identity` file, import it:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace-coding --from-identity
```

Validate:

```bash
openclaw agents list --json
```

---

## Step 4: Inject and edit `SOUL.md` per agent

There is no dedicated `openclaw agents set-soul` command. The supported pattern is:

1. Use `openclaw agents list --json` to find each agent workspace.
2. Edit each workspace `SOUL.md` file directly.

_(Note: When you need to cleanly reset or remove an agent's identity and soul, you will fully delete the agent, which handles pruning these injected files. See Step 9)._

### Recommended injection workflow (template-based)

Use the local template pack in `templates/` to standardize agent behavior:

```bash
cp templates/SOUL.md ~/.openclaw/workspace-coding/SOUL.md
cp templates/AGENTS.md ~/.openclaw/workspace-coding/AGENTS.md
cp templates/IDENTITY.md ~/.openclaw/workspace-coding/IDENTITY.md
cp templates/USER.md ~/.openclaw/workspace-coding/USER.md
cp templates/TOOLS.md ~/.openclaw/workspace-coding/TOOLS.md
```

Then replace all `<...>` placeholders with task/domain-specific values.
Use `templates/PROMPT_EXAMPLES.md` as your starter prompt catalog.

Example structure to keep behavior deterministic:

```md
# SOUL

## Role

You are the Coding Agent for backend + CI fixes only.

## Hard rules

- Do not edit billing logic.
- Do not deploy directly.
- Open a PR-ready patch and summary.

## Done criteria

- Lint passes.
- Typecheck passes.
- Unit tests pass.
```

Recommended files per agent workspace:

- `SOUL.md`: persona, scope, hard constraints.
- `AGENTS.md`: execution policy and guardrails.
- `IDENTITY.md`: public persona metadata for channel-facing behavior.
- `USER.md`: local team preferences.
- `TOOLS.md`: local setup notes and tool behavior hints.

---

## Step 4.1: Use-case sample injection (`templates/samples`)

For the agent swarm use case, use the FTS 9-agent sample pack:

- `orchestrator` (Team Leader, Claude)
- `security_architect` (Senior, Gemini)
- `sub1` (Frontend Engineer, Senior, Codex)
- `sub2` (Backend Engineer, Junior, Claude)
- `sub3` (DevOps & Cloud, Junior, Gemini)
- `data_engineer` (Senior, Codex)
- `reviewer` (QA Team Leader, Codex)
- `test_automation` (Senior, Claude)
- `compliance_auditor` (Junior, Gemini)

### Create and Inject Sample Agents

Rather than running 30+ manual commands, use the bundled setup script to automatically create the 9 OpenClaw workspaces and copy all the specific `SOUL.md`, `IDENTITY.md`, and `TOOLS.md` files for you:

```powershell
.\templates\claw-empire-integration\setup_fts_swarm.bat
```

This script will:

1. `openclaw agents add` for all 9 agents.
2. Inject the shared `USER.md` rules.
3. Inject the role-specific `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, and `TOOLS.md`.
4. Run `openclaw agents set-identity --from-identity` so the UI/CLI picks up their names and emojis.

Use `templates/samples/openclaw.discord.swarm.sample.json5` as your routing base
and `templates/samples/PROMPTS.md` for role prompt starters.

---

## Step 5: Per-agent model/provider customization via CLI + config

### Option A: set default model quickly

```bash
openclaw models set anthropic/claude-opus-4-6
```

This sets global default. For true per-agent customization, use config paths.

### Option A2: OAuth and token-based auth paths (not API key only)

OpenClaw supports OAuth/setup-token style auth in addition to API keys.

OpenAI Codex OAuth (subscription path):

```bash
openclaw onboard --auth-choice openai-codex
# or
openclaw models auth login --provider openai-codex
```

Anthropic setup-token flow:

```bash
claude setup-token
openclaw onboard --auth-choice setup-token
```

Qwen OAuth flow:

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

These paths are useful when you want per-agent provider diversity without
managing only raw API keys.

### Option B: Customize `openclaw.json` (Models, API, Provider, Commands)

You can use the CLI to dynamically edit your `openclaw.json` config.

Read current config:

```bash
openclaw config get agents
```

**Set Per-Agent Models (using your swarm's structure):**
You can specify the model directly in the config path for each sub-agent:

```bash
openclaw config set agents.list[1].model.primary '"openai-codex/gpt-5.3-codex"'
openclaw config set agents.list[5].model.primary '"openai/gpt-5.1-codex"'
```

**Set Providers & API Tokens:**
If you need to strictly set provider tokens via config (though OAuth is recommended):

```bash
openclaw config set env.OPENAI_API_KEY '"${OPENAI_API_KEY}"'
```

**Global Commands and Hooks Customization:**
Based on your setup, you might want to adjust global commands and internal hooks directly:

```bash
openclaw config set commands.native '"auto"'
openclaw config set commands.restart true
openclaw config set hooks.internal.enabled true
openclaw config set session.dmScope '"per-channel-peer"'
```

**Enable Discord Plugin:**

```bash
openclaw config set plugins.entries.discord.enabled true
openclaw config set channels.discord.enabled true
openclaw config set channels.discord.token '"YOUR_DISCORD_BOT_TOKEN"'
openclaw config set channels.discord.groupPolicy '"allowlist"'
```

Channel command behavior and routing are configured under `channels.*`, `bindings`,
`session.*`, and tool policy under `tools.*` or `agents.list[].tools`.

---

## Step 6: Advanced config edits using Gateway config RPC

Use RPC when you want audited full-replace or patch flows.

Get current hash:

```bash
openclaw gateway call config.get --params '{}'
```

Patch part of config (example pattern):

```bash
openclaw gateway call config.patch --params '{
  "raw": "{ session: { dmScope: \"per-account-channel-peer\" } }"
}'
```

Use `config.apply` for full config replace when you have a controlled payload.

---

## Step 7: Connect and manage multiple messaging accounts (Discord Swarm)

For the Discord swarm workflow, you can either configure it continuously via `openclaw.json` as shown in Step 5, or register an explicit Discord account connection.

_(OpenClaw supports running multiple Discord bots. If relying solely on one token for the channel, it operates as the "default" account)._

### Bind the Swarm Agents to Discord

Bind your agents specifically to the Discord channel so they capture events and handle tasks:

```bash
openclaw agents bind --agent orchestrator --bind discord
openclaw agents bind --agent build1 --bind discord
openclaw agents bind --agent build2 --bind discord
openclaw agents bind --agent build3 --bind discord
openclaw agents bind --agent plan --bind discord
openclaw agents bind --agent review --bind discord
```

Check your routing table:

```bash
openclaw agents bindings --json
```

Binding rules that matter:

- `channel` only => default account.
- `channel:accountId` => specific account.
- `accountId: "*"` in config => fallback for all channel accounts.
- Most-specific binding wins.

---

## Step 8: Finalize swarm routing in `openclaw.json`

For advanced Discord isolation, you might want specific sub-agents to only reply in certain Discord guild text channels (or specific roles).

Use explicit multi-agent routing inside `openclaw.json`'s `bindings` array:

```json
{
  "session": {
    "dmScope": "per-channel-peer"
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord", "accountId": "default" }
    },
    {
      "agentId": "orchestrator",
      "match": {
        "channel": "discord",
        "guildId": "1477565489772232734"
      }
    },
    {
      "agentId": "review",
      "match": {
        "channel": "discord",
        "guildId": "1477565489772232734",
        "peer": { "kind": "channel", "id": "1477565489772232736" }
      }
    }
  ]
}
```

_Note: The exact `guildId` and channel `id` should match your Discord server. Peer matches and guild inheritance determine which agent replies to a message._

Validate and restart if needed:

```bash
openclaw agents list --bindings
openclaw channels status --probe
openclaw gateway status
```

---

## Step 9: Remove an agent safely (delete + cleanup)

When decommissioning an agent (e.g., completely resetting a bugged sub-agent or fully removing its identity and injected `SOUL`), do cleanup in this strict order:

1. Remove bindings.

```bash
openclaw agents unbind --agent build3 --all
```

2. Verify there are no routes left.

```bash
openclaw agents bindings --agent build3 --json
```

3. Delete the agent and prune state/workspace.
   This command handles the cleanup of the agent's identity, injected `SOUL.md`, `AGENTS.md`, and local state configurations linked to it.

```bash
openclaw agents delete build3
```

4. Re-check global routing and health.

```bash
openclaw agents list --bindings
openclaw channels status --probe
openclaw gateway status
```

This prevents orphaned routing entries, properly deregisters them from your Discord integrations, and avoids inbound traffic hitting a deleted role.

---

## Step 10: Swarm acceptance tests

Run one turn per agent:

```bash
openclaw agent --agent strategy --message "status-check: strategy"
openclaw agent --agent coding --message "status-check: coding"
openclaw agent --agent support --message "status-check: support"
```

For the 9-agent FTS sample pack:

```bash
openclaw agent --agent orchestrator --message "status-check: orchestrator"
openclaw agent --agent security_architect --message "status-check: security_architect"
openclaw agent --agent sub1 --message "status-check: sub1"
openclaw agent --agent sub2 --message "status-check: sub2"
openclaw agent --agent sub3 --message "status-check: sub3"
openclaw agent --agent data_engineer --message "status-check: data_engineer"
openclaw agent --agent reviewer --message "status-check: reviewer"
openclaw agent --agent test_automation --message "status-check: test_automation"
openclaw agent --agent compliance_auditor --message "status-check: compliance_auditor"
```

Validate routing and gate readiness:

```bash
openclaw agents list --bindings --json
openclaw channels status --probe
openclaw gateway status
```

For orchestrator fan-out, use sub-agents:

```text
/subagents spawn coding Implement API middleware --model openai/gpt-5.1-codex --thinking high
/subagents list
/subagents log #1 200 tools
```

---

## References

- Multi-agent concept: https://docs.openclaw.ai/concepts/multi-agent
- Agents CLI: https://docs.openclaw.ai/cli/agents
- General CLI (config/models/channels): https://docs.openclaw.ai/cli
- Configuration guide: https://docs.openclaw.ai/gateway/configuration
- Configuration reference: https://docs.openclaw.ai/gateway/configuration-reference
- Provider catalog: https://docs.openclaw.ai/providers
- OpenAI provider (API + Codex OAuth): https://docs.openclaw.ai/providers/openai
- Anthropic provider (API + setup-token): https://docs.openclaw.ai/providers/anthropic
- Qwen provider (OAuth): https://docs.openclaw.ai/providers/qwen
- Sub-agents: https://docs.openclaw.ai/tools/subagents
- AGENTS template reference: https://docs.openclaw.ai/reference/templates/AGENTS
- SOUL template reference: https://docs.openclaw.ai/reference/templates/SOUL
- IDENTITY template reference: https://docs.openclaw.ai/reference/templates/IDENTITY
- USER template reference: https://docs.openclaw.ai/reference/templates/USER

---

## 🔀 Next Steps

Now that your swarm is created, what's next?

1. **Primary runtime:** Use [`agentsswarm/README.md`](agentsswarm/README.md) to run the compact local app with hybrid `$` and `#` orchestration.
2. **Routing and Architecture:** Read [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) to understand how to operate this swarm.
3. **Deep Dive configurations:** See [`MULTI_AGENT_ADVANCED.md`](MULTI_AGENT_ADVANCED.md) to wire specific Discord channels to specific agents (e.g. wire Sub1 to `#frontend`).
4. **The Control Plane:** Use [`SWARMCLAW_SETUP.md`](SWARMCLAW_SETUP.md) to add a dashboard-first orchestration layer when needed.

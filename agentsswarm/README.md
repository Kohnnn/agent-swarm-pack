# AgentSwarm

Compact OpenClaw AgentSwarm runtime for chat-first orchestration.

It focuses on seamless chat channel connectivity, compact hybrid execution, and operator-first setup instead of a heavy visual layer.

See [`CONTEXT_AND_PROGRESS.md`](CONTEXT_AND_PROGRESS.md) for the current architecture, risks, completed hardening work, and next-phase roadmap.

## What AgentSwarm does

- Accepts inbound `$` directives and `#` tasks from chat connectors.
- Normalizes Telegram, Discord, WhatsApp, and CLI traffic into one routing contract.
- Uses hybrid execution by default: lightweight board semantics plus immediate direct run.
- Keeps each use case compact with packs capped at 8 agents.
- Tracks channel, project, and managed task routes in `agentsswarm/data/bridge-state.json`.
- Relays managed task status updates back to the originating chat channel.
- Exposes local operator endpoints and CLI commands for health, routes, packs, providers, channels, and preflight checks.
- Adds request correlation IDs, message-id dedupe, TTL-based state pruning, and safer config surfacing for long-running operators.

## Compact runtime model

- `TASK_COMMAND_MODE=hybrid` is the default.
- `$directive` routes to the compact orchestrator leader.
- `#task` creates a minimal board task, then starts execution immediately.
- `STATUS_RELAY_MANAGED_ONLY=true` keeps relay polling focused on bridge-created work.
- `COMPACT_AGENT_LIMIT=8` enforces the hard cap.
- `messageId` can be supplied on inbound events to deduplicate connector retries.

## Built-in compact packs

- `software-6`: default software delivery crew
- `ops-5`: incidents, infra, automations
- `research-5`: synthesis and reports
- `support-5`: channel and customer support

## Built-in provider profile defaults

- `codex-main`: primary GitHub-backed coding profile
- `copilot-review`: secondary GitHub-backed review profile
- `claude-cli`: orchestration and review via CLI
- `gemini-cli`: research and ops via CLI
- `opencode-cli`: coding/support via CLI
- `openrouter-fallback`: API fallback profile

Use `AGENTSSWARM_PROVIDER_PROFILES_JSON` to override or extend them.

## Setup

From repository root:

Windows:

```powershell
.\setup_agentsswarm.bat
```

macOS/Linux:

```bash
./setup_agentsswarm.sh
```

Useful setup flags:

- `--update`: refresh local npm dependencies
- `--resync-env`: overwrite local env values from source-of-truth inputs when available
- `--install-openclaw`: install the OpenClaw CLI globally
- `--install-provider-clis`: install provider CLIs globally
- `--with-swarmclaw`: prepare SwarmClaw too
- `--skip-tests`: skip `npm test`

Examples:

```powershell
.\setup_agentsswarm.bat --update --install-openclaw --install-provider-clis --with-swarmclaw
```

```bash
./setup_agentsswarm.sh --resync-env --install-openclaw
```

## Start

Windows:

```powershell
.\start_agentsswarm.bat
```

macOS/Linux:

```bash
./start_agentsswarm.sh
```

Useful start flags:

- `--dev`: watch mode
- `--update`: run `npm update` before launch
- `--resync-env`: force env re-sync before launch
- `--with-swarmclaw`: auto-start SwarmClaw when it is not already running
- `--bridge-only`: do not auto-start SwarmClaw
- `--doctor`: run doctor when already running, or preflight before launch

Examples:

```powershell
.\start_agentsswarm.bat --with-swarmclaw --doctor
```

```bash
./start_agentsswarm.sh --dev --resync-env
```

## Required env

- `BRIDGE_SECRET` unless you intentionally run `ALLOW_UNSECURED_BRIDGE=true` for local development
- `SWARMCLAW_ACCESS_KEY`
- `INBOX_WEBHOOK_SECRET`

Common optional env:

- `AGENTSSWARM_API_URL`
- `AGENTSSWARM_AUTH_TOKEN`
- `DEFAULT_PROJECT_PATH`
- `DEFAULT_PLATFORM`
- `DEFAULT_ACCOUNT_ID`
- `DEFAULT_COMPACT_PACK`
- `DEFAULT_PROVIDER_PROFILE`
- `AGENTSSWARM_REQUIRED_CLI_TOOLS`
- `AGENTSSWARM_PROVIDER_PROFILES_JSON`
- `AGENTSSWARM_PACKS_JSON`
- `MAX_INGEST_BODY_BYTES`
- `INGEST_MESSAGE_ID_TTL_MS`
- `CHANNEL_ROUTE_TTL_MS`
- `PROJECT_ROUTE_TTL_MS`
- `TASK_ROUTE_TTL_MS`
- `PROJECT_PATH_CACHE_TTL_MS`
- `HTTP_RETRY_MAX_ATTEMPTS`
- `HTTP_RETRY_BASE_DELAY_MS`

See `agentsswarm/.env.example` for the full template.

## Chat routing contract

The bridge accepts one normalized envelope for all inbound sources:

```json
{
  "text": "#ship release",
  "messageId": "discord-987654321",
  "connectorId": "connector-1",
  "channelId": "engineering-room",
  "platform": "discord",
  "accountId": "primary",
  "threadId": "release-thread",
  "projectPath": "C:/workspace/app",
  "providerProfileId": "codex-main",
  "compactPackKey": "software-6",
  "senderId": "user-1",
  "senderName": "Founder"
}
```

Route priority:

1. task route
2. channel route
3. project route
4. default route

## CLI commands

```bash
npm run cli -- health
npm run cli -- routes
npm run cli -- channels
npm run cli -- summary
npm run cli -- providers
npm run cli -- packs
npm run cli -- preflight
npm run cli -- doctor
npm run cli -- prune --dry-run
```

Channel simulation examples:

```bash
npm run cli -- ingest --text "$sync roadmap" --connector founder --channel founders --platform telegram --account primary --pack software-6 --providerProfile codex-main
npm run cli -- ingest --text "#ship release" --connector eng --channel engineering --platform discord --thread release-room --pack software-6 --providerProfile copilot-review
npm run cli -- ingest --text "$triage customer issue" --connector support --channel biz --platform whatsapp --account biz --pack support-5 --providerProfile opencode-cli
```

## HTTP endpoints

- `GET /health`
- `GET /routes`
- `GET /channels`
- `GET /providers`
- `GET /packs`
- `GET /summary`
- `POST /ingest`
- `POST /maintenance/prune`

## SwarmClaw connector config

For each manager connector in SwarmClaw, set connector `config` keys:

- `bridgeEndpoint=http://127.0.0.1:7799`
- `bridgeSecret=<BRIDGE_SECRET>` when `BRIDGE_SECRET` is set
- `bridgeProjectPath=<absolute path>` when a connector should default to one project

## Operator workflow

1. Run setup.
2. Run OpenClaw auth flow for the provider profiles you want.
3. Wire SwarmClaw connectors for Telegram, Discord, and/or WhatsApp.
4. Start AgentSwarm.
5. Run `npm run cli -- doctor`.
6. Send `$` or `#` commands from chat.

## Verification

Inside `agentsswarm/`:

```bash
npm run check
npm test
npm run cli -- preflight
```

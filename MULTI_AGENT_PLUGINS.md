# OpenClaw Community Plugins & Extensions

The OpenClaw ecosystem is highly extensible using its plugin architecture. By browsing the [`openclaw-extension`](https://github.com/topics/openclaw-extension) topic on GitHub, you can discover numerous tools built by the community to enhance agent swarms.

To install a standard plugin via the CLI:

```bash
openclaw plugins enable <plugin-name>
```

---

## 🌟 Top Recommendations for Discord Swarms

When configuring an advanced, multi-agent swarm connected to a public or team-facing Discord server (as detailed in `MULTI_AGENT_ADVANCED.md`), these extensions are highly recommended to ensure security, monitor costs, and debug effectively.

### 1. **[prompt-security/clawsec](https://github.com/prompt-security/clawsec)**

- **Role**: Security & Drift Detection
- **Why it matters**: If your agents are exposed to users in Discord, they are vulnerable to Prompt Injection attacks or social engineering. `clawsec` actively protects your agent's `SOUL.md` identity and prevents users from coercing the agent into executing malicious system commands or dumping internal memory.

### 2. **[mnfst/manifest](https://github.com/mnfst/manifest)**

- **Role**: Cost Tracking & LLM Routing
- **Why it matters**: A busy Discord server can generate massive API bills if every message hits `claude-opus-4-6`. `manifest` acts as a smart router, tracking token costs and automatically routing simple Discord queries to cheaper local models (like Ollama), while reserving expensive APIs for complex orchestration.

### 3. **[massaindustries/openclaw-logger](https://github.com/massaindustries/openclaw-logger)**

- **Role**: Visual Log Dashboard
- **Why it matters**: Discord chat is a terrible place to read long stack traces or internal agent monolithic thought processes. This logger provides an out-of-band dashboard to explore OpenClaw logs with AI, letting you see _why_ an agent responded the way it did in Discord.

### 4. **[0-Vault/Vault-0](https://github.com/0-Vault/Vault-0)**

- **Role**: Secret Management & Monetization
- **Why it matters**: If your Discord swarm handles sensitive user data or requires payments (x402 native), Vault-0 provides an encrypted secret vault and policy enforcement layer entirely separate from the agent's memory.

---

## 💬 Other Messaging Connectors

If your swarm outgrows Discord or needs a multi-platform presence, the community maintains plugins for other major networks:

- **[openclaw-qq-plugin](https://github.com/CreatorAris/openclaw-qq-plugin)**: Connect agents to QQ channels via NapCat.
- **[openclaw-wecom-plugin](https://github.com/CreatorAris/openclaw-wecom-plugin)**: Enterprise WeChat (WeCom) integration.
- **[openclaw-telegram-approval-buttons](https://github.com/JairFC/openclaw-telegram-approval-buttons)**: Adds inline UI buttons for agent execution approvals directly inside Telegram chats.

---

## 🕹️ Dashboards & Orchestration

Managing swarms purely through the CLI can get complex. These visual tools help you manage your agent "employees":

- **[clawbridge](https://github.com/dreamwing/clawbridge)**: A mobile dashboard to monitor agent real-time thoughts, actions, and token costs from your phone.
- **[`agentsswarm/`](agentsswarm/README.md)**: This repo's compact chat-first runtime for hybrid execution, compact packs, and multi-provider profiles.
- **[swarmclaw](https://github.com/swarmclawai/swarmclaw)**: Run a self-hosted OpenClaw-centric control plane for providers, gateway operations, tasks, connectors, and orchestration.
- **[ClawKitchen](https://github.com/JIGGAI/ClawKitchen)** & **[Claw-Kanban](https://github.com/GreenSheep01201/Claw-Kanban)**: Visual Kanban boards and dashboards for assigning agile tasks and tracking the goals of multi-agent teams.

---

## 🧠 Agent Capabilities & Skills

Expand what your agents can actually _do_ with these specialized skills:

- **[human-browser](https://github.com/al1enjesus/human-browser)**: Grants agents a "stealth" Playwright browser that bypasses major anti-bot challenges (Cloudflare, DataDome), crucial for agents doing web research.
- **[kindly-web-search-mcp-server](https://github.com/Shelpuk-AI-Technology-Consulting/kindly-web-search-mcp-server)**: A robust content retrieval and web search integration (Serper, Tavily).
- **[ai-todo](https://github.com/fxstein/ai-todo)**: Persistent, version-controlled TODO tracking that works naturally with OpenClaw's workflow.

---

## 🛠️ Development & IDE

- **[openclaw-extension](https://github.com/OpenKnots/openclaw-extension)**: A native VS Code extension for controlling and monitoring your OpenClaw agents directly from your editor.

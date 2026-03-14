# Paperclip Setup Guide

[Paperclip](https://github.com/paperclipai/paperclip) is an **open-source orchestration tool for zero-human companies**. While OpenClaw handles the individual Agent logic (the "employee"), Paperclip acts as the "company," managing org charts, budgets, reporting lines, and task ticketing across multiple tools.

This guide explains how to install Paperclip alongside your OpenClaw setup to manage a structured multi-agent architecture (e.g., Orchestrator -> Sub-agents -> Reviewer).

---

## 1. Prerequisites

Before starting, ensure you have:

| Requirement | Version   | Check Command   |
| ----------- | --------- | --------------- |
| Node.js     | **20+**   | `node -v`       |
| pnpm        | **9.15+** | `pnpm -v`       |
| git         | Any       | `git --version` |

If you need `pnpm`, you can install it via:
```bash
npm install -g pnpm
```

---

## 2. Installation

Use the included batch script to automatically clone and set up Paperclip within the workspace.

**Windows PowerShell:**
```powershell
.\setup_paperclip.bat
```

This script will:
1. Clone the `paperclipai/paperclip` repository to `.\paperclip`.
2. Run `pnpm install` in the new directory.

### Manual Setup Alternative
If you prefer not to use the `.bat` file:
```bash
git clone https://github.com/paperclipai/paperclip.git
cd paperclip
pnpm install
```

---

## 3. Starting the Server

To launch the Paperclip dashboard and server:

**Windows PowerShell:**
```powershell
.\start_paperclip.bat
```

Paperclip will start on its default port. You can open your browser to **http://localhost:3100** to view your orchestration dashboard.

---

## 4. Integrating with Your OpenClaw Use Case

Paperclip is designed to structure your agent interactions. In your overarching goal of having an **Orchestrator Agent**, multiple **Sub-agents (1, 2, 3)**, and a **Reviewer Agent**, Paperclip organizes these roles into an "Org Chart".

### Step-by-Step Flow:
1. **Define the Company/Project Goal:** In the Paperclip UI, create a project goal (e.g., "Draft and Publish Social Media Posts").
2. **Hire Your OpenClaw Agents:**
   - Add your Orchestrator as a "Manager" or "CEO" level agent.
   - Add Sub-agents 1, 2, and 3 as task executors reporting to the Orchestrator.
   - Add your Reviewer Agent as a Quality Assurance role.
3. **Assign Budgets and Heartbeats:** Paperclip lets you assign token constraints and specific "wake times" for agents, so they aren't constantly draining API balance when idle.
4. **Execution and Tracing:** When the Orchestrator assigns a sub-agent a task, a ticket is created. The sub-agent logs its tool calls and thought processes directly to that ticket. The Reviewer agent can then be pinged to review the ticket's history before final approval and pushing code.

By combining AgentsSwarm (OpenClaw's execution model) and Paperclip (the Org Chart configuration), your autonomous agents act synchronously on business goals.

---

## Next Steps

1. Review [AGENTS.md](AGENTS.md) to define the actual system prompts of the Orchestrator and Reviewer.
2. If you want to connect these agents to Discord or Telegram, check out [MULTI_AGENT_SETUP.md](MULTI_AGENT_SETUP.md) for network routing rules.

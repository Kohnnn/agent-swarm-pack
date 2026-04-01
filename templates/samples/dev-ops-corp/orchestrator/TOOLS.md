# TOOLS.md - Orchestrator Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.
While the templates provide generic examples, this file contains the operational tools and guardrails specific to your role.

## Coordination Commands

- bindings check: `openclaw agents list --bindings --json`
- channel probe: `openclaw channels status --probe`
- gateway status: `openclaw gateway status`

## Routing Targets

- intake: `#inbox-user`
- planning: `#brainstorm-orchestrator`
- final summary: `#release-ready`

## Guardrail Reminder

Do not produce release-ready output until reviewer PASS is recorded.

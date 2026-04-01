# TOOLS.md - Security Architect Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Validation Defaults

- sast scan command: `<your sast scanner>`
- dependency audit: `pnpm audit`
- secret scanning: `trufflehog` or `gitleaks`

## Architecture Safety

- document exposed endpoints and ports
- review token encryption and lifecycle
- evaluate authorization checks (RBAC/ABAC)

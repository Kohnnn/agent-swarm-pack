# Review Desk Pack

**Use case:** Systematic review of any work item — code, content, compliance, style, and quality — with structured feedback and a clear final verdict.

## The Promise

Submit anything for review. Get structured feedback from the right specialists, synthesized into actionable notes, with a clear PASS or FAIL verdict. Nothing ships without the right eyes on it.

## Agent Roster

| Agent | Brain Name | Role | Responsibility |
|-------|-----------|------|---------------|
| `review_lead` | — | Quality Commander | Queue management, reviewer assignment, final verdict |
| `technical_reviewer` | — | Code Whisperer | Correctness, logic, architecture, edge cases |
| `compliance_reviewer` | — | Regulatory Guardian | Policy alignment, legal exposure, regulatory gaps |
| `style_guide_enforcer` | — | Consistency Guardian | Brand voice, formatting, accessibility |
| `quality_assurance` | — | Last Defense | Testing, functional verification, release readiness |
| `feedback_curator` | — | Constructive Voice | Synthesizes + delivers all reviewer feedback |

## How It Works

### Review Pipeline

```
Item submitted to review_lead
        ↓
review_lead assigns to appropriate reviewers
        ↓
technical_reviewer ──┐
compliance_reviewer ──┼── parallel review
style_guide_enforcer ─┤
quality_assurance ────┘
        ↓
feedback_curator synthesizes all feedback
        ↓
review_lead issues verdict
        ↓
#release-ready (PASS) or back to creator (FAIL/CONDITIONAL)
```

### Reviewer Assignment Matrix

| Work Type | Required Reviewers |
|-----------|------------------|
| Code changes | technical_reviewer + quality_assurance |
| Compliance-sensitive | compliance_reviewer + quality_assurance |
| External-facing content | style_guide_enforcer + quality_assurance |
| Full release | all reviewers |

### Verdict Types

| Verdict | Meaning | Next Action |
|---------|---------|-------------|
| **PASS** | Ready for release | Proceed |
| **FAIL** | Blocking issues found | Fix and resubmit |
| **CONDITIONAL** | Non-blocking issues noted | Proceed with awareness |
| **HOLD** | Major concerns | Discuss with user |

## Issue Severity Guide

| Severity | Example | Action |
|----------|---------|--------|
| CRITICAL | Security vulnerability, data loss | Fix before anything else |
| HIGH | Major functionality broken | Must fix before release |
| MEDIUM | Non-critical bug | Should fix, release allowed with waiver |
| LOW | Polish issue | Fix when convenient |

## Feedback Delivery Format

```
BLOCKING (Must fix before release):
- [Reviewer] <issue> (<severity>)

IMPORTANT (Should fix):
- [Reviewer] <issue> (<severity>)

NICE TO HAVE:
- [Reviewer] <issue> (<severity>)

Resolved from previous review:
- <what was fixed>

Questions for clarification:
- <open questions>
```

## Typical Usage

### Submit for Review

Send to review_lead:
```
Review PR #42 — new user authentication flow
Scope: technical + compliance
```

### Receive Feedback

feedback_curator delivers the synthesized notes. review_lead issues the verdict.

### Revision Cycle

If FAIL:
1. Creator fixes issues
2. Resubmits to review_lead
3. Relevant reviewers re-check
4. feedback_curator updates
5. review_lead re-issues verdict

## Key Rules

- review_lead is the decision-maker — reviewers recommend, review_lead decides
- Never ship without quality_assurance sign-off
- Escalate security and compliance issues immediately (don't wait for the gate)
- feedback_curator delivers — review_lead decides on conflicts

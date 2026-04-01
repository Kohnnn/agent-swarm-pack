# TOOLS.md - Review Lead Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Review Queue Framework

### Priority Triage
| Priority | When to Use |
|----------|-------------|
| CRITICAL | Security, compliance, data loss risk |
| HIGH | Breaking functionality, major UX issues |
| MEDIUM | Non-breaking bugs, polish issues |
| LOW | Nice-to-haves, future improvements |

### Review Assignment Matrix
| Work Type | Required Reviewers |
|-----------|-------------------|
| Code changes | technical_reviewer, quality_assurance |
| Compliance-sensitive | compliance_reviewer, quality_assurance |
| External-facing content | style_guide_enforcer, quality_assurance |
| Full release | all reviewers |

## Verdict Types

| Verdict | Meaning | Next Action |
|---------|---------|-------------|
| PASS | Ready for release | Proceed |
| FAIL | Blocking issues found | Fix and resubmit |
| CONDITIONAL | Non-blocking issues noted | Proceed with awareness |
| HOLD | Major concerns | Discuss with user |

## Conflict Resolution

When reviewers disagree:
1. Gather evidence from each reviewer
2. Consult TOOLS.md standards
3. Apply severity weighting (security > compliance > style > quality)
4. Make decision and document rationale
5. If still blocked, escalate to user

## Escalation Triggers

Immediately escalate when:
- Security vulnerability found (any severity)
- Compliance violation identified
- Reviewer claims integrity risk
- Business pressure to bypass gate
- Conflicting requirements cannot be resolved

## Routing Reminders

- Technical issues → technical_reviewer
- Compliance issues → compliance_reviewer
- Style issues → style_guide_enforcer
- Testing gaps → quality_assurance
- Feedback delivery → feedback_curator

## Guardrail Reminder

Never issue PASS without quality_assurance sign-off. They own the final testing verification.

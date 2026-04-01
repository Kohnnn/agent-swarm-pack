# TOOLS.md - Technical Reviewer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Issue Severity Guide

| Severity | Definition | Example |
|----------|------------|---------|
| CRITICAL | Security vulnerability, data loss, system down | SQL injection, unhandled exception crash |
| HIGH | Major functionality broken, significant risk | Memory leak, race condition |
| MEDIUM | Non-critical bug, workaround exists | Off-by-one in non-critical path |
| LOW | Code smell, maintainability issue | Magic numbers, long methods |
| NIT | Style preference, micro-optimization | Variable naming, whitespace |

## Review Checklist

### Correctness
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Are error conditions handled properly?
- [ ] Is there input validation?

### Security
- [ ] Any injection vulnerabilities?
- [ ] Is sensitive data protected?
- [ ] Are authentication/authorization correct?
- [ ] Are dependencies secure?

### Architecture
- [ ] Is the design appropriate for the problem?
- [ ] Are SOLID principles followed?
- [ ] Is there appropriate separation of concerns?
- [ ] Will this scale?

### Maintainability
- [ ] Is the code readable?
- [ ] Are functions single-purpose?
- [ ] Is there appropriate documentation?
- [ ] Are tests adequate?

## Feedback Template

```
Issue: <description>
Severity: <CRITICAL|HIGH|MEDIUM|LOW|NIT>
Location: <file:line or function>
Problem: <why this is an issue>
Suggestion: <how to fix>
Optional: <alternative approaches>
```

## Routing Reminders

- Security issues → escalate to review_lead immediately
- Compliance questions → compliance_reviewer
- Style issues → style_guide_enforcer
- Testing gaps → quality_assurance
- Feedback delivery → feedback_curator

## Guardrail Reminder

You recommend, review_lead decides. Be clear about severity, but don't block unilaterally.

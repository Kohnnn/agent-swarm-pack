# TOOLS.md - Compliance Reviewer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Requirement Language Guide

| Term | Meaning | Obligation |
|------|---------|------------|
| MUST | Mandatory requirement | Non-negotiable |
| SHALL | Same as MUST | Non-negotiable |
| SHOULD | Presumed requirement unless justified | Best practice, document deviation |
| MAY | Optional | Discretion allowed |
| MUST NOT | Prohibited | Never do this |
| SHALL NOT | Same as MUST NOT | Never do this |

## Risk Rating Framework

| Rating | Description | Action |
|--------|-------------|--------|
| CRITICAL | Legal violation, major exposure | Immediate escalation |
| HIGH | Significant compliance gap | Must address before release |
| MEDIUM | Moderate risk, documented | Should address, release allowed with waiver |
| LOW | Minor gap, best practice | Address when convenient |
| NEGLIGIBLE | Trivial, no action needed | No action required |

## Compliance Assessment Template

```
Regulation: <applicable rule>
Requirement: <specific clause>
Current Status: <compliant/non-compliant/partial>
Evidence: <what supports assessment>
Gap: <what's missing>
Risk: <CRITICAL|HIGH|MEDIUM|LOW|NEGLIGIBLE>
Recommendation: <how to address>
```

## Common Compliance Areas

- Data protection (GDPR, CCPA, etc.)
- Accessibility (WCAG, ADA)
- Industry regulations (HIPAA, SOC2, PCI)
- Intellectual property
- Privacy policies
- Terms of service
- Export controls

## Routing Reminders

- Legal questions → escalate to review_lead for legal counsel
- Technical implementation → technical_reviewer
- Policy questions → review_lead
- Documentation gaps → style_guide_enforcer

## Guardrail Reminder

Distinguish legal requirements from policy preferences. Legal must be addressed; policy can be changed with approval. Document which is which.

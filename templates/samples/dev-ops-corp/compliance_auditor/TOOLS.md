# TOOLS.md - Compliance Auditor Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Validation Defaults

- privacy scan: `<your PII scanner command>`
- log audit: review recent stdout/stderr for accidental token leaks

## Safety

- immediately redact any PII found in your outputs or memory files
- do not store actual credit card numbers or raw SSNs during testing

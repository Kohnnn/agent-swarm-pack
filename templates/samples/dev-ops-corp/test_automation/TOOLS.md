# TOOLS.md - Test Automation Engineer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Validation Defaults

- unit testing: `npm run test`
- e2e testing: `npx playwright test` or `cypress run`
- coverage report: `npm run test:coverage`

## Safety

- ensure tests run in isolation against a seeded, detached test database
- never run e2e operations against production endpoints

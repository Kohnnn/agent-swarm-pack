# TOOLS.md - Data Engineer Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Validation Defaults

- query validation: `npm run lint:sql`
- dbt tests: `dbt test` or equivalent
- dry-run pipelines: `<dry run command>`

## Safety

- always use transaction blocks when updating multiple rows
- do not drop tables or columns unless explicitly authorized by the Orchestrator
- prefer soft deletes

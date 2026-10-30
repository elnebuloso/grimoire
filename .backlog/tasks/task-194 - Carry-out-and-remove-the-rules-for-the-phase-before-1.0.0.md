---
id: TASK-194
title: Carry out and remove the rules for the phase before 1.0.0
status: To Do
assignee: []
created_date: '2026-10-30 23:20'
labels: []
milestone: m-2
dependencies: []
priority: high
type: task
ordinal: 256000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the v0 rules: `.claude/rules/until-v1.md` holds rules for the phase before `1.0.0`, each section naming when it ends. Carry out what each section asks for at 1.0.0:
- Database: squash all migrations in `app/src/lib/server/db/migrations/` into a single `0001`, have the user sign off the final schema, and restore the section on schema updates on start, their rollback and `MIGRATE_ONLY` in `docs/handbook/database.md` (its last text is in the history of that file).
- ADR status: the project owner (`Projectowner`) reviews every ADR in `docs/decisions/` and sets its status; only they change a status.
- Releases: the rule against breaking-change markers ends with 1.0.0.
The file itself is deleted in the commit that cuts 1.0.0 (the release task). Check the installed charter rules for other v0-only rules, e.g. a `v0-design` rule, and remove what no longer applies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migrations are squashed into one `0001`; a fresh database from it equals the current schema, and the user has signed off the schema
- [ ] #2 `docs/handbook/database.md` describes schema updates on start, their rollback and `MIGRATE_ONLY` again
- [ ] #3 Every ADR has been reviewed by the project owner, who set its status
- [ ] #4 No other rule for the phase before 1.0.0 is left; `.claude/rules/until-v1.md` is ready to be deleted with the release commit
- [ ] #5 `make lint`, `make test`, `make e2e` and `make handbook` pass
<!-- AC:END -->

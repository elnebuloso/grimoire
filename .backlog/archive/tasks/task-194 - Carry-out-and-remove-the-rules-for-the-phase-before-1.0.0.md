---
id: TASK-194
title: Carry out and remove the rules for the phase before 1.0.0
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 12:31'
labels: []
milestone: m-1
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
- [x] #1 Migrations are squashed into one `0001`; a fresh database from it equals the current schema, and the user has signed off the schema
- [x] #2 `docs/handbook/database.md` describes schema updates on start, their rollback and `MIGRATE_ONLY` again
- [x] #3 Every ADR has been reviewed by the project owner, who set its status
- [x] #4 No other rule for the phase before 1.0.0 is left; `.claude/rules/until-v1.md` is ready to be deleted with the release commit
- [x] #5 `make lint`, `make test`, `make e2e` and `make handbook` pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ADRs consolidated to 0001-0005 (commit a0ecb30); the project owner accepted all five on 2026-10-31, status set to Accepted. The 'ADR status' section of .claude/rules/until-v1.md is removed.

Schema signed off by the user on 2026-10-31 after four changes to 0001-initial.sql: users.email CHECK (email = lower(email)), api_keys.name CHECK (trim(name) <> ''), missed_queries.sources as a sorted JSON array with json_valid (was comma-separated text the page split again), and no location in the settings comment. The migrations were already a single 0001.

docs/handbook/database.md has '## Schema updates' again (start, rollback by backup, MIGRATE_ONLY, exact error text of an older version), and 'Updating from a 0.x release' says there is no path to 1.0.0 either. make handbook passes.

No other pre-1.0 rule is installed (v0-adrs.md from the charter is not). Agreed with the user: the release commit that deletes .claude/rules/until-v1.md adds to .claude/rules/memory.md, under a new 'Database' heading, the one rule that outlives it: 'A released migration is never edited; a schema change is a new numbered file.' 0.x notes in README.md and docs/handbook/docker.md belong to TASK-196. make lint, make test (735), make e2e (21) and make handbook passed after the last code change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Carried out the pre-1.0 rules except the deletion itself: ADRs consolidated to 0001-0005 and accepted by the project owner; schema in the single 0001 migration signed off after four changes (email case, API key name, missed query sources as JSON, settings comment); docs/handbook/database.md describes schema updates, rollback by backup and MIGRATE_ONLY again, and says 0.x databases have no path to 1.0.0. until-v1.md is ready to be deleted in the release commit (TASK-195), which also adds the forward-only migration rule to memory.md.
<!-- SECTION:FINAL_SUMMARY:END -->

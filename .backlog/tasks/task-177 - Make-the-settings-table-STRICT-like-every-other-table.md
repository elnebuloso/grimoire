---
id: TASK-177
title: Make the settings table STRICT like every other table
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:49'
labels: []
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 239000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`settings` is the only table in `app/src/lib/server/db/migrations/0001-initial.sql` without `STRICT`. With a single integer column this is harmless today, but the schema is to be signed off before 1.0 and should be consistent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every table in the schema is declared `STRICT`
- [x] #2 Existing tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Declare `settings` in `0001-initial.sql` as `STRICT`, changing the squashed schema in place as the rules before 1.0 allow
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`settings` in `app/src/lib/server/db/migrations/0001-initial.sql` is now `STRICT` like every other table. Verified: `pragma_table_list` on a fresh database shows `strict = 1` for all 13 tables (FTS5 shadow tables aside); db and settings tests green.
<!-- SECTION:FINAL_SUMMARY:END -->

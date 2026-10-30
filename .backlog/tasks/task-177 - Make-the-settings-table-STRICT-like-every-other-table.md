---
id: TASK-177
title: Make the settings table STRICT like every other table
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 Every table in the schema is declared `STRICT`
- [ ] #2 Existing tests pass
<!-- AC:END -->

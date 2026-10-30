---
id: TASK-173
title: Record the failing commit in the sync history
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - sync
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 235000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a sync fails, the failing commit is known and stored on the source as `failed_commit`, but `sync_runs.commit_hash` stays `NULL` for every failed run (`app/src/lib/server/sync/sync.ts`). The history cannot show which commit broke, or that the same commit kept failing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A failed run whose commit is known stores it in `sync_runs.commit_hash`
- [ ] #2 A failed run before a commit is known (e.g. clone error) keeps `NULL`
- [ ] #3 A test covers both cases
<!-- AC:END -->

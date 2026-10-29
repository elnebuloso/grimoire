---
id: TASK-39
title: Measure how syncing a large repository blocks request handling
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels:
  - sync
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sync runs in the server process. Parsing and indexing a large documentation repository is synchronous work on the main thread (`node:sqlite`, remark), so requests may stall while a big source syncs. This was never measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The time the event loop is blocked while syncing a large documentation repository is measured and recorded in the task
- [ ] #2 If agent requests stall noticeably, a follow-up task describes the fix
<!-- AC:END -->

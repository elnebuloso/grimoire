---
id: TASK-91
title: Sync history per source
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
priority: low
type: feature
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source keeps only the state of its last sync: one error or a list of warnings. Since when a source has been failing, when its commit last changed, or whether a sync ran at all last night cannot be answered. That is the first question when a source stops being current.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every sync run of a source is recorded with start, end, outcome (unchanged, synced, failed), commit and error
- [ ] #2 The source page lists the most recent runs
- [ ] #3 Only a bounded number of runs per source is kept
- [ ] #4 A deleted source takes its history with it
- [ ] #5 Tests cover recording each outcome and the bound
<!-- AC:END -->

---
id: TASK-16
title: 'Admin: source status and sync'
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-8
  - TASK-15
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Doc authors and operators need to see whether their docs arrived and what is broken, without reading logs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Per source: last sync, commit, number of pages, snippets and tokens
- [ ] #2 Sync errors and warnings are shown at the source
- [ ] #3 A preview shows the snippets of a page as agents receive them
- [ ] #4 Dead links are listed with the page they occur on
- [ ] #5 A "Sync now" button starts a sync of the source
<!-- AC:END -->

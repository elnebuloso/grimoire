---
id: TASK-219
title: Give Dead links an entry in the management navigation
status: To Do
assignee: []
created_date: '2026-10-31 13:50'
labels:
  - admin
dependencies: []
priority: low
type: enhancement
ordinal: 281000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The page `/manage/dead-links` has no entry in the management navigation; it is reached only through the count of dead links on `Manage > Overview`, and `docs/handbook/admin.md` needs a clause to explain the way there. Found by the handbook audit in TASK-196.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The management navigation links `Dead links` next to the other management pages, with its label in every `app/messages/<locale>.json`
- [ ] #2 `docs/handbook/admin.md` names the path `Manage > Dead links` instead of the way through the overview
- [ ] #3 The e2e or story coverage of the navigation includes the new entry
<!-- AC:END -->

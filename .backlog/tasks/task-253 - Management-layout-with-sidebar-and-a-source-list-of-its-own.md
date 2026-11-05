---
id: TASK-253
title: Management layout with sidebar and a source list of its own
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-252
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 315000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nine management links sit in one row, quality lists mixed with administration; sources, the core of the product, have no entry and hide under "Overview" (finding U12). Chapter 10.1 of the concept groups the sidebar into Inhalte, Qualität, Zugang, System; chapter 10.3 gives sources their own list page. Owner decision O10: no further role is planned.

Measure M6 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The management area shows a sidebar with the groups and entries of chapter 10.1, collapsible on a phone
- [ ] #2 Counters appear only for items needing action and only when above zero
- [ ] #3 `/manage/sources` lists all sources with the New source action; `/manage` shows needed actions and totals without the source table
- [ ] #4 Source detail pages mark "Quellen" as current
- [ ] #5 Adding a sidebar entry is one entry in its data
- [ ] #6 No `isAdmin` branch remains in the management layout and overview
- [ ] #7 "My API keys" and "Account" are no longer in the management navigation
- [ ] #8 `manage.e2e.ts` and the handbook paths (`Manage > …`) are updated
<!-- AC:END -->

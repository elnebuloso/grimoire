---
id: TASK-219
title: Give Dead links an entry in the management navigation
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:50'
updated_date: '2026-10-31 13:53'
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
- [x] #1 The management navigation links `Dead links` next to the other management pages, with its label in every `app/messages/<locale>.json`
- [x] #2 `docs/handbook/admin.md` names the path `Manage > Dead links` instead of the way through the overview
- [x] #3 The e2e or story coverage of the navigation includes the new entry
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add Dead links to the links of app/src/routes/manage/+layout.svelte, drop it from OVERVIEW_CHILDREN. 2. Extend the navigation test in manage.e2e.ts. 3. admin.md: Manage > Dead links.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The management navigation lists Dead links (existing message dead_links in en and de) after Queries without results; it marks itself as current instead of the overview. manage.e2e.ts clicks it and checks aria-current. admin.md names Manage > Dead links. Checked in the agent environment in dark at full width and light at 400 px (wraps cleanly). manage.e2e.ts passed (16).
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-260
title: Same last sync and commit in source list and source page
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
  - sync
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: bug
ordinal: 322000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
For a source that never synced successfully the table shows a sync time while the source page says "never"; the history shows a commit while the status says "none" (finding U9). Admins cannot tell when content was last updated, which is the key question when something fails.

Measure M13 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 For every source, list and detail show the same time of the last successful sync and the same commit
- [ ] #2 A source that never synced successfully shows no sync time anywhere
- [ ] #3 A spec covers a source that never synced successfully
<!-- AC:END -->

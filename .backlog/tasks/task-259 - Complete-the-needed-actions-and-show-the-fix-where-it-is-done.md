---
id: TASK-259
title: Complete the needed actions and show the fix where it is done
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-256
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 321000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Duplicate sources appear neither under "Needs attention" nor on the source page; they are found only through their own menu entry. The hint how to fix a sync error shows on the overview but not on the source page where the fix happens (findings U10, U11). With hundreds of sources the list of needed actions has to stay readable (owner decision O6).

Measure M12 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Duplicates and overlaps appear under needed actions and as a hint on both sources
- [ ] #2 The fix hint for a sync error shows on the source's Status sub page
- [ ] #3 Needed actions are grouped by kind with a count and the first entries; "show all" leads to the filtered list
<!-- AC:END -->

---
id: TASK-258
title: 'Shared data table with search, filter and sort for every list'
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 320000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Six tables are written inline in routes, status words come from two places, sources are named by slug in some places and by name in others, and on a phone status and actions fall off the right edge (findings U13, U19, U26). Owner decision O6: an instance holds hundreds of sources, so every list needs search, filter and sort.

Measure M11 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No table is written inline in a route; lists use `DataTable` with search, filter and sort held in the URL and loading in pages from about 100 rows
- [ ] #2 Status words of sources and syncs come only from `StatusBadge`
- [ ] #3 Sources appear everywhere with name and slug below (`SourceLabel`)
- [ ] #4 The scope of a key is shown by `KeyScope`, shortened when long
- [ ] #5 On a phone each row shows name, status and action
- [ ] #6 With 500 sources in the test data every list stays usable
- [ ] #7 `DataTable`, `StatusBadge`, `SourceLabel`, `KeyScope`, `EmptyState` have stories per state with axe; `SourceStatsTable` is gone
<!-- AC:END -->

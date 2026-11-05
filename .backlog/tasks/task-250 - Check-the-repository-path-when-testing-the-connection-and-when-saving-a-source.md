---
id: TASK-250
title: Check the repository path when testing the connection and when saving a source
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
priority: high
type: bug
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
"Test connection" only runs `git ls-remote` and reports "Reachable" even when the path in the repository does not exist; the first sync then fails. A wrong path is the most common setup error. The test also refuses to run until a name is entered, and the new-source form pre-fills the path with `docs` although an empty path means the whole repository (findings U2, U3, U24). Owner decision O2: the test checks access, branch and path with the same slim clone the sync uses; saving checks the path too, but only when Git URL, branch or path changed.

Measure M3 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 "Test connection" fails with the same message the sync gives today when the path does not exist in the branch
- [ ] #2 Saving a source with a changed Git URL, branch or path checks the path and refuses a missing one with an error at the path field
- [ ] #3 Saving without such a change does not contact the Git server
- [ ] #4 "Test connection" works without a name
- [ ] #5 The new-source form does not pre-fill the path
- [ ] #6 Specs cover a missing path for both the test and saving
<!-- AC:END -->

---
id: TASK-6
title: Link resolution
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-5
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents follow links with `read`, so relative Markdown links (`deploy.md#rollback`) must point to grimoire IDs. Recording every link also gives the admin area backlinks and dead links; a relative link that leaves the source path is broken in MkDocs as well.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Relative links are rewritten to grimoire IDs (`platform/auth-service/deploy#rollback`) in the snippet text
- [ ] #2 Every link is stored with its source page/anchor and target ID
- [ ] #3 Links to files or anchors that do not exist, and links leaving the source path, are recorded as dead
- [ ] #4 Backlinks of a page can be queried
- [ ] #5 External links stay unchanged
<!-- AC:END -->

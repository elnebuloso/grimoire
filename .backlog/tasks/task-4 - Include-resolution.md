---
id: TASK-4
title: Include resolution
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-3
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MkDocs pages pull shared content in with `--8<-- "file.md"`; without resolving it agents would see the directive instead of the content. Included files may themselves contain includes and may lie outside the source path, which the sync has to fetch separately. A cycle (`a.md` -> `b.md` -> `a.md`) must not hang the sync.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `--8<-- "file.md"` is replaced by the content of the file, resolved from the repository root
- [ ] #2 Nested includes are resolved
- [ ] #3 A file already in the current include chain is not inserted again and is reported as a warning
- [ ] #4 A missing include target is reported as a warning and the rest of the page is still processed
- [ ] #5 Include targets outside the source path are reported so the sync can fetch them
- [ ] #6 Unit tests cover nesting, a cycle and a missing target
<!-- AC:END -->

---
id: TASK-142
title: Move splitCode from the database module into parsing/
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 204000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `splitCode` in `app/src/lib/server/db/sources.ts` (around lines 302-316) parses Markdown to separate code blocks from prose for search weighting. Markdown parsing belongs in `app/src/lib/server/parsing/`, which is pure; with it in `db/`, the database module reaches `remark`. `replaceSourceIndex` uses it (around line 135), and `app/src/lib/server/sync/sync.spec.ts` tests it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `splitCode` lives in `app/src/lib/server/parsing/` and `db/sources.ts` no longer imports Markdown parsing
- [ ] #2 Search texts are unchanged; the existing `splitCode` test passes from its new place
<!-- AC:END -->

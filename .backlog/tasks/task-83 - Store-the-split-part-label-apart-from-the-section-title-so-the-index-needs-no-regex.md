---
id: TASK-83
title: >-
  Store the split-part label apart from the section title, so the index needs no
  regex
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
labels:
  - agent-api
  - parsing
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/parsing/chunk.ts
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/agent/operations.spec.ts
priority: low
type: bug
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`collectSnippets` in `app/src/lib/server/parsing/chunk.ts` writes `"<title> (i/n)"` into the stored title path of each part of a section that was split into several snippets. `indexProject` in `app/src/lib/server/agent/operations.ts` strips it again with the regex `/ \(\d+\/\d+\)$/`. The format is decided in one module and reversed by pattern in another.

Consequences: a real heading ending in something like `(1/2)` or `(24/7)` loses that text in the index, whether its section was split or not. A change of the part label in `chunk.ts` (e.g. "part 1 of 2", or a localised form) leaves the regex silently matching nothing and the index then shows "(1/3)" titles. No test ties the two together: the index test in `operations.spec.ts` checks the current output, not the contract.

If the stored shape changes, the index of existing sources is rebuilt by the next sync or needs a migration; check how earlier changes to stored snippet data were handled (`app/src/lib/server/db/migrations/`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The stored title path holds the bare section title; the part number and count, if needed, are stored separately
- [ ] #2 The `(i/n)` label is added only where a snippet is rendered, and `indexProject` uses no regex to remove it
- [ ] #3 A heading that really ends in `(24/7)` keeps it in the index, covered by a test that fails on the old code
- [ ] #4 Split sections still show their part label in search results and read output
<!-- AC:END -->

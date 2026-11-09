---
id: TASK-83
title: >-
  Store the split-part label apart from the section title, so the index needs no
  regex
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 01:34'
updated_date: '2026-10-30 01:47'
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
- [x] #1 The stored title path holds the bare section title; the part number and count, if needed, are stored separately
- [x] #2 The `(i/n)` label is added only where a snippet is rendered, and `indexProject` uses no regex to remove it
- [x] #3 A heading that really ends in `(24/7)` keeps it in the index, covered by a test that fails on the old code
- [x] #4 Split sections still show their part label in search results and read output
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `Snippet` gets `part`/`parts`; `collectSnippets` stores the bare section title.
2. New columns `snippets.part`/`parts` (migration 0013, which also strips the label from existing title paths and FTS titles where it matches the computed part exactly).
3. Both snippet queries select part/parts; `toSnippetHit` adds `(i/n)` to the last title when parts > 1. `indexProject` drops the regex.
4. Tests: chunk part/parts, index keeps `Hotline (24/7)`, migration 0013, existing read test for split labels.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The FTS `title_path` now holds the bare title too, so "1/2" is no longer searchable, which nobody searches for. The migration groups parts by (page_id, anchor): parts of a split section share the anchor, the overview's parts a NULL one. The new index test failed on the old code. Agent environment after `make agent-reset` and resync: no `(i/n)` label in the platform index; search shows "Rolling back step by step (1/2)" and "(2/2)". 436 server tests and make lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The part number of a split section is stored in the new columns `snippets.part`/`parts` (migration 0013 converts existing indexes) instead of as a `(i/n)` suffix in the title. The label is added only when a snippet is rendered (`toSnippetHit`), and `indexProject` lost the regex that also cut real headings such as `Hotline (24/7)`. Verified by new chunk, index and migration tests, the full server suite, make lint, and the agent environment after a reset and resync.
<!-- SECTION:FINAL_SUMMARY:END -->

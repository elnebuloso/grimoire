---
id: TASK-404
title: 'Sync: skip a page too large to index instead of failing the whole source'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
labels:
  - sync
  - parsing
dependencies: []
priority: medium
type: bug
ordinal: 466000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). There is no size limit per page in `app/src/lib/server/sync/index-source.ts` (around lines 147-156 and 318); the 1M-character limit covers only included text. Case (plausible, not measured): a generated 50-100 MB `api.md` is parsed several times, the indexing child (`index-worker.ts`) runs out of memory, and the failure (kind `aborted`) counts as repeating (`REPEATING_KINDS` in `sync.ts`), so the whole source stays on its old index until a commit removes the file. The error names no file, and the handbook's fix for it is to ask for more memory. Fix shape: check each file's size before reading and skip pages above a limit with a warning naming the file, as other skipped pages are warned about. The limit is chosen from a measurement, not guessed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The size at which one page makes the indexing process fail is measured, and the chosen limit and its reason are in the notes and the code
- [ ] #2 A page above the limit is skipped with a sync warning naming the file and the limit; the other pages are indexed
- [ ] #3 `docs/handbook/writing.md` (sync warnings) names the limit and the warning text
- [ ] #4 A spec covers a page above the limit
<!-- AC:END -->

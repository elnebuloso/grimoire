---
id: TASK-404
title: 'Sync: skip a page too large to index instead of failing the whole source'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:45'
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
- [x] #1 The size at which one page makes the indexing process fail is measured, and the chosen limit and its reason are in the notes and the code
- [x] #2 A page above the limit is skipped with a sync warning naming the file and the limit; the other pages are indexed
- [x] #3 `docs/handbook/writing.md` (sync warnings) names the limit and the warning text
- [x] #4 A spec covers a page above the limit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured with a temporary probe (deleted): a generated API reference (sections with a table and a code block) through a real sync. Heap 256 MB: 0.1 MB synced (4.8 s, peak 316 MB), 1 MB and more aborted (SIGABRT). Default heap on this machine: 0.3 MB 9.9 s / 583 MB, 1 MB 26.9 s / 1054 MB, 20 MB aborted after 54 s. Per phase (0.3 MB): preprocess 2.4 s, chunk 3.2 s, links 1.6 s, splitCode 1.3 s: linear, but about 25 s and 1 GB per MB of such Markdown, the cost of the mdast tree; not changed here. The largest of 3,906 pages at the pinned fixture commit is 0.73 MB (fastapi release-notes.md), p99 86 KB, p99.9 272 KB, so MAX_PAGE_BYTES = 1,000,000 skips none of them (benchmark not rerun: no page reaches the limit). Limit checked with stat before reading. Spec in index-source.spec.ts; the out-of-memory spec in sync.spec.ts now uses a 0.74 MB page (2,000 sections) so it is still parsed. writing.md has the warning row. Left open: on a 512 MiB container a table-heavy page from about 0.4 MB can still exhaust memory and hold the source back, with an error naming no file; naming the page being processed in the abort error would be a follow-up.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pages above 1 MB are skipped with the warning "<file>: larger than 1 MB, skipped" instead of making the indexing process run out of memory and holding the whole source back. Limit from measurement (about 1 GB per MB of table-heavy Markdown; the largest real benchmark page has 0.73 MB). Handbook and specs updated. Remaining risk: a page between about 0.4 and 1 MB can still exhaust a 512 MiB container.
<!-- SECTION:FINAL_SUMMARY:END -->

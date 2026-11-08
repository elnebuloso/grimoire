---
id: TASK-409
title: 'Sync: name the page being indexed when the indexing process ends early'
status: To Do
assignee: []
created_date: '2026-11-08 21:10'
labels:
  - sync
dependencies:
  - TASK-404
priority: low
type: enhancement
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up of TASK-404. Parsing costs about 1 GB of memory and 25 s per MB of table-heavy Markdown (measured on a generated API reference, see the notes of TASK-404). Pages above `MAX_PAGE_BYTES` (1 MB, `app/src/lib/server/sync/index-source.ts`) are now skipped, but on a container with 512 MiB a page from about 0.4 MB can still exhaust the memory of the indexing child. The sync then fails with `indexing ended with SIGABRT before it finished, out of memory for example` (built in `indexInProcess`, `app/src/lib/server/sync/sync.ts`, on the child's `close`), kind `aborted`, which repeats on the same commit and keeps the source on its old index, and the message names no file. The admin can only ask for more memory (`docs/handbook/admin.md`, sync errors) without knowing which page to split. The child (`app/src/lib/server/sync/index-worker.ts`) talks to the server over the IPC channel of `fork`, today once with its outcome; telling the server which page it starts on would let the error name it. A message per page must stay cheap on sources with thousands of pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When the indexing process ends early while parsing a page, the sync error names that page (path in the repository), e.g. `indexing ended with SIGABRT before it finished, while indexing docs/api.md, out of memory for example`
- [ ] #2 An early end outside page parsing (e.g. while writing the index) keeps the current text
- [ ] #3 `syncErrorKind` still classifies the new text as `aborted`; `docs/handbook/admin.md` (sync errors) tells the admin to split the named page or ask for more memory
- [ ] #4 A spec with a page that exhausts a small heap (as the out-of-memory spec in `sync.spec.ts` does) asserts the page in the error; the time of a sync of a large source does not measurably grow (`make benchmark` indexing times within tolerance)
<!-- AC:END -->

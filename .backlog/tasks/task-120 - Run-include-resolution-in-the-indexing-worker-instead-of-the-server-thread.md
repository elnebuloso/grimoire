---
id: TASK-120
title: Run include resolution in the indexing worker instead of the server thread
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
labels:
  - sync
  - parsing
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The indexing stage runs in a worker thread (`app/src/lib/server/sync/index-worker.ts`, started from `indexInWorker` in `app/src/lib/server/sync/sync.ts`, see the comment around lines 288-291) precisely so that heavy work does not block or crash the thread that answers HTTP requests. But `prepareCheckout` in `app/src/lib/server/sync/index-source.ts` runs in `sync.ts` before `indexInWorker`, on the main thread: `readdirSync`, `readFileSync` and the include expansion of every page, plus the URL include fetch loop. Large or hostile docs therefore stall request handling during a sync, and an out-of-memory there ends the whole server rather than just the sync. Note for the image: the worker is loaded from copied source files under `src/lib/server` (see `Dockerfile` and the comments in `index-worker.ts`); anything the worker imports must stay under `src/lib/server`, be imported with a `.ts` extension, and use production dependencies only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reading the checkout and expanding includes happen in the worker thread, not on the server thread
- [ ] #2 URL include fetches still honour the allowed origins and the per-sync cap
- [ ] #3 Sync results (pages, snippets, warnings, dead links) for the fixture sources are unchanged
- [ ] #4 Existing sync tests pass; a test or check shows the main thread no longer calls the include resolver during a sync
<!-- AC:END -->

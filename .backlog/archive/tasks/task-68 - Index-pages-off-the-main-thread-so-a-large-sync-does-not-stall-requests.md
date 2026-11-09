---
id: TASK-68
title: 'Index pages off the main thread, so a large sync does not stall requests'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 23:07'
updated_date: '2026-10-29 23:43'
labels:
  - sync
milestone: m-0
dependencies: []
priority: high
type: enhancement
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Measured in TASK-39 with the built server and the Kubernetes documentation (`kubernetes/website`, `content/en/docs`: 1722 pages, 13160 snippets): while the source synced, one agent search waited 72.6 s; before the sync, searches took 10 ms (p50) and at most 82 ms. The sync took 76 s from check to done, and apart from the clone, which runs in a separate git process, the event loop was blocked for all of it.

A CPU profile of the same sync puts 61 s (78 %) into Markdown processing with remark/micromark (parsing and serialising), about 2 s into the SQLite write (`replaceSourceIndex`) and the rest into chunking, YAML and garbage collection. Each page is parsed three times (`preprocess.ts`, `chunk.ts`, `links.ts` once per snippet) and serialised twice.

So the work that blocks is the per-page processing in `indexCheckout` (`app/src/lib/server/sync/index-source.ts`), not the database. Moving it into a worker thread (`node:worker_threads`) keeps the main thread free for requests; the clone and the single write transaction stay where they are. Parsing each page once instead of three times would shorten the sync but not end the blocking on its own.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 While a source like the Kubernetes documentation syncs, agent searches on the same server answer within 500 ms, measured the way TASK-39 measured
- [x] #2 The index a sync produces is the same as before: pages, snippets, links and warnings
- [x] #3 A failing page, a failing worker or a sync stopped by a shutdown leaves the previous index in place and reports the error at the source, as today
- [x] #4 The worker code is part of the built server and the Docker image; nothing has to be installed or copied by hand
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Find out whether a worker can be part of the built server: Vite leaves new URL('./x.ts', import.meta.url) untouched in the SSR build, so the worker is loaded from source with Node's type stripping, located through import.meta.resolve('#lib/...'); verified in Vitest, the dev server and the built server.
2. Split indexCheckout: prepareCheckout (main thread: files, includes, fetching) and indexPages (parse, chunk, links) in index-pages.ts.
3. index-worker.ts runs indexPages and replaceSourceIndex over its own connection; the modules it loads use relative .ts imports.
4. replaceSourceIndex parses the search texts before taking the write lock.
5. Tests on a file database; a worker that fails while writing; Dockerfile copies app/src/lib/server; measure as in TASK-39.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-10-30 as in TASK-39 (built server, Kubernetes documentation, one agent search every 25 ms):
- first sync, 1722 pages: 2642 requests, p50 3.0 ms, p99 9.1 ms, max 272 ms, none over 500 ms; the two slowest at the start, while the main thread reads the files and resolves includes.
- full re-sync with the index in place: 2653 requests, p50 9.1 ms, p99 21.2 ms, max 251 ms (before: one request waited 72.6 s); same 1722 pages and 13160 snippets; the sync still takes about 80 s.
Docker image: the container indexed the fixture repository through the worker (index-worker.ts found through #lib in app/package.json), no error.
The server connection already waits up to 5 s for a lock (BUSY_TIMEOUT_MS); the worker's write transaction is short because the search texts are parsed before it starts. make lint, make test (449), make e2e (15), make handbook pass.

Resources measured 2026-10-30 in the Docker image, first sync of the Kubernetes documentation (1722 pages), agent search every 25 ms; memory as cgroup peak (memory.peak) and process peak RSS (VmHWM):
- no limits: sync 77 s; searches p99 11 ms, max 326 ms; cgroup peak 933 MiB, process 807 MiB (V8 keeps the heap it grew to).
- --cpus 1 --memory 512m: sync 160 s; p99 46 ms, max 411 ms; cgroup peak 392 MiB, process 284 MiB; no OOM kill.
- --cpus 0.5 --memory 256m: sync 383 s; p95 72 ms, p99 77 ms, max 1345 ms; cgroup at its 256 MiB limit, no OOM kill.
Deployment unchanged: same process, same /data, temp clone in /tmp as before. Documented under Kubernetes → Resources in docs/handbook/docker.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A sync no longer blocks the server: the Markdown processing (preprocess, chunk, links) and the write of the new index run in a worker thread with its own database connection. Agents keep searching the previous index until the write commits. Measured on the Kubernetes documentation (1722 pages): the slowest search during a full re-sync now takes 251 ms, before 72.6 s; the index is the same.

The worker runs from source (Node type stripping) because Vite does not bundle server workers; it is found through #lib, works in the dev server, Vitest and the built server, and the image now ships app/src/lib/server. The modules it loads use relative .ts imports. prepareCheckout keeps the reading, includes and fetching on the main thread; indexPages holds the processing. A failing write in the worker leaves the old index and reports the error at the source (tested). Sync tests now use a database file.
<!-- SECTION:FINAL_SUMMARY:END -->

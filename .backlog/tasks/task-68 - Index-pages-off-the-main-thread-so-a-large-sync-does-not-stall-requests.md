---
id: TASK-68
title: 'Index pages off the main thread, so a large sync does not stall requests'
status: To Do
assignee: []
created_date: '2026-10-29 23:07'
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
- [ ] #1 While a source like the Kubernetes documentation syncs, agent searches on the same server answer within 500 ms, measured the way TASK-39 measured
- [ ] #2 The index a sync produces is the same as before: pages, snippets, links and warnings
- [ ] #3 A failing page, a failing worker or a sync stopped by a shutdown leaves the previous index in place and reports the error at the source, as today
- [ ] #4 The worker code is part of the built server and the Docker image; nothing has to be installed or copied by hand
<!-- AC:END -->

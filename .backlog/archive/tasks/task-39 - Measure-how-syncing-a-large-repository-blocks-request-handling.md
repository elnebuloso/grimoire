---
id: TASK-39
title: Measure how syncing a large repository blocks request handling
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29 23:08'
labels:
  - sync
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sync runs in the server process. Parsing and indexing a large documentation repository is synchronous work on the main thread (`node:sqlite`, remark), so requests may stall while a big source syncs. This was never measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The time the event loop is blocked while syncing a large documentation repository is measured and recorded in the task
- [x] #2 If agent requests stall noticeably, a follow-up task describes the fix
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-10-29 with the built server (make build, node build) and a fresh database holding one source: the Kubernetes documentation, https://github.com/kubernetes/website.git, branch main, path content/en/docs; 1722 pages, 13160 snippets. A probe sent one agent search at a time (GET /p/<project>/query?q=install+configure&tokens=500 with an API key) every 25 ms and recorded each response time.
- Baseline with the index in place, no sync: 529 requests, p50 9.7 ms, p95 20.6 ms, max 82 ms.
- During a full re-sync (last_commit cleared): 2073 requests; all but one as fast as the baseline (p99 22.5 ms), and one request that waited 72.6 s. Check at 23:00:50, synced at 23:02:06: 76 s, of which the event loop was blocked about 72.6 s; only the clone (a separate git process) ran without blocking.
- The first sync of the same source took about 80 s (not probed; the probe had stopped on a connection reset, fixed by sending Connection: close).
- CPU profile of another full re-sync (node --cpu-prof): 60.9 s (78 %) in remark/micromark, Markdown parsing and serialising; about 2 s in replaceSourceIndex and the SQLite write; 3.6 s in the rest of the sync code; 2.7 s garbage collection. Each page is parsed three times (preprocess.ts, chunk.ts, links.ts per snippet) and serialised twice.
Agent requests stall for the length of a large sync, so the follow-up is TASK-68: index pages in a worker thread.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured: while the server indexes a large documentation repository (Kubernetes docs, 1722 pages), the event loop is blocked for about 72.6 s of a 76 s sync, and an agent search waits that long; without a sync searches take about 10 ms. 78 % of the time is Markdown processing with remark/micromark on the main thread, about 2 s is the SQLite write. Details and method in the notes; the fix, indexing in a worker thread, is TASK-68.
<!-- SECTION:FINAL_SUMMARY:END -->

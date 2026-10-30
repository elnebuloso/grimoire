---
id: TASK-146
title: Check what a worker that runs out of memory does to the server
status: To Do
assignee: []
created_date: '2026-10-30 11:29'
updated_date: '2026-10-30 11:29'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: spike
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Open point from the second whole-project code review of 2026-10-30. Indexing runs in a worker thread (`indexInWorker` in `app/src/lib/server/sync/sync.ts`, entry `app/src/lib/server/sync/index-worker.ts`); the comment above `indexInWorker` claims that a docs branch exhausting memory there ends only the sync, not the server. Nobody has verified this: the worker is started without `resourceLimits`, and whether Node ends only the worker or the whole process when its heap is exhausted, and what the container memory limit does first, was not checked. Include expansion is capped (1,000,000 characters per page, 100 URL includes per sync), but a large repository or a parser bug can still use a lot of memory. If the process dies instead, every sync of that source would take the server down until the commit changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A worker that exhausts its memory is tried in this project (test or documented experiment with the Node version of the image, `node:24.22.1` in `Dockerfile`), and the result is written in the task notes
- [ ] #2 If only the sync fails: a test keeps it that way (the sync ends as `failed` with a readable error and the server keeps answering)
- [ ] #3 If the process dies: the worker gets `resourceLimits` (or an equivalent) so it ends only the sync, with such a test, and the comment above `indexInWorker` states what is true
<!-- AC:END -->

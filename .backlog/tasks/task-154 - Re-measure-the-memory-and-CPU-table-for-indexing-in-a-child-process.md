---
id: TASK-154
title: Re-measure the memory and CPU table for indexing in a child process
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: docs
ordinal: 216000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25). The table under "Memory and CPU limits" in `docs/handbook/docker.md` (Kubernetes documentation as one source, 1722 pages, 13,160 snippets, agents searching every 25 ms; rows: none 77 s / 933 MiB; 1 CPU, 512 MiB 160 s / 392 MiB; 0.5 CPU, 256 MiB 383 s / 256 MiB at the limit) and the recommendation `limits: { cpu: "1", memory: 512Mi }` were measured while indexing still ran in a worker thread. TASK-146 moved indexing into a child process, which adds the baseline memory of a second Node process; its summary says so. An operator sizing a pod from the table may therefore set a limit at which syncs now fail with `indexing ended with … before it finished, out of memory for example`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The table in `docs/handbook/docker.md` reflects measurements of the current build (image with indexing in a child process), or is clearly marked as measured before that change with the extra memory stated
- [ ] #2 The recommended `limits`/`requests` match the table
<!-- AC:END -->

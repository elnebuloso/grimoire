---
id: TASK-362
title: 'Specs: the deadline spec must not race the stand-in''s pid file'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 00:55'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/sync.spec.ts
priority: low
type: task
ordinal: 424000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The spec "stops the processes the indexing process started when it outlasts the deadline" in `app/src/lib/server/sync/sync.spec.ts` (around lines 286-327) runs a stand-in worker (`indexingScript`) that starts `sleep 60` and writes its pid to a file, with an indexing deadline of 2,000 ms counted from `fork`. If the stand-in has not started, received the message, spawned `sleep` and written the file within 2 s, `readFileSync(pidFile)` throws ENOENT although the deadline logic worked, and the `sleep` started later is left behind.

Measured: fork until the pid file exists 187–423 ms on a moderately loaded machine; the whole test 2.5–2.95 s with two server runs in parallel. A failure needs a 5–10x slowdown of a Node start – the order seen when the grant-admin specs failed – not reproduced.

Suggested fix: wait for the pid file with `vi.waitFor(() => existsSync(pidFile), { timeout: 10_000 })` before reading it, as the "server exits" spec above it already does, or raise the deadline to about 5 s.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The spec reads the pid file only once it exists
- [x] #2 It passes with two `make test TEST=--project=server` runs in parallel
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The deadline spec starts the sync, waits for the stand-in's pid file with vi.waitFor, then awaits the result
2. Deadline 5 s instead of 2 s, so the stand-in starts its child before the kill even on a busy machine
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- sync.spec.ts passes; two `make test TEST=--project=server` runs in parallel pass (1068 tests each).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The deadline spec of the indexing process now waits for the stand-in's pid file before reading it, with a 5-second deadline instead of 2, so a slow start of the stand-in on a busy machine no longer fails it with ENOENT or leaves a sleep behind. It passes in two parallel server runs.
<!-- SECTION:FINAL_SUMMARY:END -->

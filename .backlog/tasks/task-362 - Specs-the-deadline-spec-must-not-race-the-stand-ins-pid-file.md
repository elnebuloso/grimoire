---
id: TASK-362
title: 'Specs: the deadline spec must not race the stand-in''s pid file'
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
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
- [ ] #1 The spec reads the pid file only once it exists
- [ ] #2 It passes with two `make test TEST=--project=server` runs in parallel
<!-- AC:END -->

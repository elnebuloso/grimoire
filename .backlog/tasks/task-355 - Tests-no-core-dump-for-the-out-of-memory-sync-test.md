---
id: TASK-355
title: 'Tests: no core dump for the out-of-memory sync test'
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
labels:
  - sync
dependencies: []
references:
  - Makefile
  - app/src/lib/server/sync/sync.spec.ts
  - .claude/rules/testing-strategy.md
priority: medium
type: task
ordinal: 417000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/sync/sync.spec.ts` (around lines 330-353, timeout 60 s) checks that a sync whose indexing runs out of memory fails and other sources keep syncing; the heap limit is passed via `--max-old-space-size` (`app/src/lib/server/sync/sync.ts`). V8 out of memory ends the child with `abort()` (SIGABRT). On the dev machine `core_pattern` is `|/wsl-capture-crash`; for a piped core pattern the kernel dumps even with `ulimit -c 0`, so every OOM child is dumped into the crash handler, which takes most of the time.

Measured: the same indexing outside vitest reaches the fatal error after about 1.7 s, but the process ends after 8.5–10 s; with `prlimit --core=1` (the kernel skips piped dumps at RLIMIT_CORE=1) it ends in 0.98 s; a bare `node -e "process.abort()"` takes 5.6 s, 0.07 s with `--core=1`. The test: 17.8 s idle, 3.3 s under `prlimit --core=1`, 34.9 s and 56.9 s of 60 s with two `--project=server` runs in parallel; it failed once at 61 s. `ulimit -c 1` does not work: bash counts in 1024-byte blocks.

Suggested fix: run the test command in the Makefile `test` recipe under `prlimit --core=1` (util-linux; check it exists on the GitHub runners and in the dev setup), then lower the test's timeout to the file's 30 s. Update the timings in `.claude/rules/testing-strategy.md` (`sync.spec.ts` 47 s).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The out-of-memory test takes a few seconds on an idle machine and stays well inside its timeout under two parallel server runs
- [ ] #2 `make test` works on the dev machine and in CI with the change
- [ ] #3 The timings in `testing-strategy.md` are updated
<!-- AC:END -->

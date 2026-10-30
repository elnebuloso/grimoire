---
id: TASK-191
title: Speed up the test suites along the testing strategy
status: To Do
assignee: []
created_date: '2026-10-30 23:20'
labels: []
milestone: m-2
dependencies: []
priority: medium
type: task
ordinal: 253000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply what `.claude/rules/testing-strategy.md` measured. The biggest single cost: `src/lib/server/sync/sync.spec.ts` takes 38 of the 39 s of the server project. Find out where that time goes (real waits, timeouts, polling intervals, git operations, fixture setup per test) and cut it without losing what the tests prove; then look at the next slowest files (`migrate.spec.ts` about 10 s, `chunk.spec.ts` about 7 s) and the e2e run (production build plus serial `manage.e2e.ts`). Update the measured durations in the rules file afterwards.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The slowest spec files are profiled and the found waste is removed; every test still fails when the code it covers breaks
- [ ] #2 The durations in `.claude/rules/testing-strategy.md` are measured again and updated
- [ ] #3 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

---
id: TASK-170
title: Remove wall-clock assertions from the parsing tests
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 232000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Four tests assert on measured time: in `app/src/lib/server/parsing/chunk.spec.ts` and two in `app/src/lib/server/parsing/include.spec.ts` a call must take `< 1000 ms` (it took seconds before the fix they guard), and "numbers repeated headings about as fast as distinct ones" in `chunk.spec.ts` times two runs of 5,000 headings back to back and asserts `repeated < distinct * 3`. A GC pause or a busy core during either run flips the last one; commit `00a6927` already loosened it once. A test that turns green on a rerun without a code change counts as broken in this project. TASK-162 covers a different test (`sync.spec.ts`) whose cause is still unknown.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No test in `app/src/lib/server/parsing/` asserts on elapsed time
- [ ] #2 The tests still fail if heading suffixes or section markers become quadratic again (input sized so the quadratic version exceeds the test timeout, or the property checked without a clock)
<!-- AC:END -->

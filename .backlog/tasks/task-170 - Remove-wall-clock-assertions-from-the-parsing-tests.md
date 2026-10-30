---
id: TASK-170
title: Remove wall-clock assertions from the parsing tests
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:45'
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
- [x] #1 No test in `app/src/lib/server/parsing/` asserts on elapsed time
- [x] #2 The tests still fail if heading suffixes or section markers become quadratic again (input sized so the quadratic version exceeds the test timeout, or the property checked without a clock)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Measure the pre-fix code (worktrees at 7214b64^ and b668b8d^) to size each input past the test timeout
2. Drop every `performance.now()` assertion; assert only the result
3. Run the new tests against the pre-fix code to prove they still fail
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Old vs new with the new inputs (Node 24.22.1): heading with 250,000 spaces/braces 125 s vs 60 ms; include name 60,000× 102 s vs 8 ms; 200,000 dashes 41 s vs 5 ms; 20,000 repeated headings 100 s vs 2.7 s (linear chunking costs about 0.14 ms per heading, hence a 30 s timeout on that test instead of the default 5 s). The old times come from running the new spec files in worktrees of the pre-fix commits, where all four tests fail on their timeout.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The four timing tests in `app/src/lib/server/parsing/chunk.spec.ts` and `include.spec.ts` no longer read a clock. Their inputs are sized so that the quadratic versions they guard against take 41 to 125 s, far past the test timeout, while the current code takes milliseconds (2.7 s for 20,000 repeated headings, which has a 30 s timeout). The relative "repeated < distinct * 3" comparison is gone. Verified: the new tests run against the pre-fix code (worktrees of 7214b64^ and b668b8d^) fail on the timeout; parsing tests green (107).
<!-- SECTION:FINAL_SUMMARY:END -->

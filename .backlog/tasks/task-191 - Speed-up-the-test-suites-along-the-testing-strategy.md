---
id: TASK-191
title: Speed up the test suites along the testing strategy
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 01:04'
labels: []
milestone: m-1
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `sync.spec.ts`: keep the six boundary tests (happy path with includes, unchanged then new commit, error in the child rolls back, deadline, out of memory, source deleted before the sync) on a fixture built once per file; move orchestration to a new `sync-logic.spec.ts` (real `sync.ts`, `./git` and `fork` mocked) and pure assertions to `index-source`, `index-pages`, `db/sources` and `queue` specs.
2. `chunk.spec.ts`: export `assignAnchors` and test the linear numbering on hand-built headings; smaller list input.
3. `migrate.spec.ts`: run the 20 race rounds in parallel batches.
4. E2E: log in once and reuse the session; drop or shrink what route specs and stories cover; move missing checks down (`handleRobots`, language fallback, German 404 title).
5. Re-measure, update `.claude/rules/testing-strategy.md`, run `make lint`, `make test`, `make e2e`.
Every moved assertion: the lower test fails on a deliberately broken line before the higher one goes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Step 1, `sync.spec.ts`: 20 tests, 28 s alone -> 6 boundary tests, 14.5 s. The git fixture is built once per file and copied per test. Moved down, each new test seen failing on a deliberately broken line first: orchestration (check times, check before the sync stage, run history, failed-commit skip and retry, git error kept, token redaction, wrong key, deleted while queued) to the new `sync-logic.spec.ts` (real `sync.ts`, `./git` and `fork` mocked, 9 tests in 1.9 s); nav positions and slugify wiring to `index-source.spec.ts`; the "no page could be indexed" throw to the new `index-pages.spec.ts`; `last_synced_at` and the clearing of `failed_commit` to `db/sources.spec.ts`. Dropped as duplicates: deleted before the check (same path as before the sync). The out-of-memory test stays at about 8 s: a smaller page stops overflowing, and a smaller heap limit still costs about 7 s of last-resort garbage collection.
<!-- SECTION:NOTES:END -->

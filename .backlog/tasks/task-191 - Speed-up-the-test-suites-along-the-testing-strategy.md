---
id: TASK-191
title: Speed up the test suites along the testing strategy
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 01:17'
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

Step 2, `chunk.spec.ts`: about 3.3 s -> 0.7 s. `assignAnchors` is exported and its linear numbering is tested on 20,000 hand-built headings (137 ms); with the quadratic version restored the test fails (62 s, past the timeout). The list test uses 25 items of 40 tokens and asserts that the list is over 800 tokens, so it still runs the split path.

Step 3, `migrate.spec.ts`: running the 20 race rounds in parallel batches of 4 cut the test from 6.2 s to 2.8 s, but with the WAL retry in `enableWriteAheadLog` removed it failed in 0 of 8 runs, against 3 of 8 for the sequential version. Reverted; the test stays sequential. Also found: even sequentially it catches a missing WAL retry only in about 40 % of runs, not "almost every run" as its comment says. A deterministic test of the retry would fix both; not done here, needs the user's decision.

Step 4, e2e: `manage.e2e.ts` 17 -> 15 tests, 45 s -> 39 s alone; `make e2e` 54 s -> about 42 s, green twice in a row, each file green alone. The session of the login flow is reused where a test needs an admin but no login (7 logins fewer). Dropped as covered lower: the robots test (new `handleRobots` unit test in `access.spec.ts`, seen failing with the header removed; the 403 test still checks the header end to end), 11 of 15 title pages (PageHead stories cover the composition; one page per kind of title stays), the start-page cells (`SourceStatsTable` stories), the failed create with an unreachable repository (`sources.spec.ts`), the wrong current password (`access.spec.ts`), and the used reset link and old password (`password-reset.spec.ts`). The empty start page and the login link to the setup are one test now. The `missing.git` mapping in `playwright.config.ts` went with its last user. `language.e2e.ts` stays: its fallback is Paraglide's own negotiation through the real server, and the file costs about 3 s.
<!-- SECTION:NOTES:END -->

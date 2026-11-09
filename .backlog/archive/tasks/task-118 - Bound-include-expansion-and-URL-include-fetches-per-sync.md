---
id: TASK-118
title: Bound include expansion and URL include fetches per sync
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:49'
labels:
  - sync
  - parsing
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. `resolveIncludes` in `app/src/lib/server/parsing/include.ts` (lines 62-136) detects cycles (the same target again on the current include chain) but does not limit fan-out. Example: `a.md` includes `b.md` ten times, `b.md` includes `c.md` ten times, and so on six levels down: no cycle, but the expanded page holds about a million copies of the last file, and the process runs out of memory. URL includes have the same gap: content fetched from an allowed origin can name new URLs, and the loop in `prepareCheckout` (`app/src/lib/server/sync/index-source.ts`, lines 69-93) fetches them round after round with no limit on rounds or on the number of URLs. The threat model in the code already names who can trigger this: the comment near `index-source.ts:123` says "anyone who can push to a docs branch". A docs repository is untrusted input; one push must not be able to exhaust memory. Cycles already end the expansion with a warning, so a budget overrun can end the same way.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Include expansion of one page stops at a fixed output budget (bytes or lines); the page is indexed with the content up to the budget and the sync records a warning naming the page, the same way an include cycle is reported
- [ ] #2 The number of URL includes fetched per sync is capped; includes beyond the cap are not fetched and produce a warning instead of an endless fetch loop
- [ ] #3 A unit test with a fan-out include tree (no cycle) that would exceed the budget finishes quickly and bounded, and asserts the warning
- [ ] #4 A unit test shows URL content that names further URLs stops at the cap
- [ ] #5 The handbook page that describes includes names the limits and what happens when they are reached
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Count included characters per page in resolveIncludes; past MAX_INCLUDED_CHARACTERS (1,000,000) warn once and insert nothing further.
2. Cap URL fetches per sync in prepareCheckout at MAX_URL_INCLUDES (100); further URLs get a problem entry so the existing not-fetched warning applies and the round loop ends.
3. Tests for fan-out tree and endless URL chain; handbook writing.md.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
resolveIncludes now stops at 1,000,000 included characters per page with one warning (MAX_INCLUDED_CHARACTERS); prepareCheckout fetches at most 100 URL includes per sync (MAX_URL_INCLUDES) and reports further ones as not fetched. Tests: a ten-way, six-level include tree finishes bounded with one warning; a URL chain that keeps naming new URLs stops after 100 fetches. Handbook writing.md names both limits. make lint and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->

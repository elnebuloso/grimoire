---
id: TASK-149
title: Make the section-marker regex and unique heading anchors linear
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 13:41'
updated_date: '2026-10-30 14:04'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 211000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the whole-project code review of 2026-10-30 (13:25), measured with Node 24.22.1. Two parsing steps take time quadratic in input a docs branch controls, which can push a sync past the 10-minute indexing deadline (and, until a failed commit is no longer retried, hold the single sync lane every interval).

1. `SECTION_MARKER` in `app/src/lib/server/parsing/include.ts` (`/^(.*?)(;*)(-+8<-+[ \t]+)(\[...\])(.*)$/i`): on a line of dashes, `-+` is retried from every position. It runs on every line of every page that is not an include, and on every line of an included file. Measured through `resolveIncludes`: a 10,000-character line of `-` takes 137 ms, 20,000 characters 545 ms; extrapolated, a 200 KB line about a minute, 1 MB about 23 minutes (the include budget allows pages of 1,000,000 characters).
2. Unique anchors in `app/src/lib/server/parsing/chunk.ts` (the loop with `/^(.*)_(\d+)$/`): each heading whose slug is taken counts up from `_1` through every suffix already used, so `k` identical headings cost `k²/2` steps. Measured through `chunkPage`: 2,000 `## a` headings 0.9 s, 4,000 2.6 s, 8,000 10.9 s, against 1.0 s for 8,000 different headings. 8,000 headings are only 48 KB; a generated reference page repeating `### Parameters` thousands of times hits this without anyone meaning harm.

`splitSelection` and `takeAttributeListId` were made linear earlier for the same reason, and `include.spec.ts` / `chunk.spec.ts` already hold time-limited tests for them. Anchors and marker matches must stay exactly as they are today (pymdownx.snippets / MkDocs-compatible).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A 200,000-character line of `-` passes through `resolveIncludes` in well under a second, covered by a time-limited test in `include.spec.ts`
- [x] #2 Section markers (`--8<-- [start:name]` / `[end:name]`, also inside code comments and after leading text) are recognized exactly as before; existing include tests pass unchanged
- [x] #3 8,000 identical headings pass through `chunkPage` in about the time of 8,000 different ones, covered by a time-limited test in `chunk.spec.ts`
- [x] #4 Generated anchors are unchanged, including repeated headings, custom `{#id}` anchors and headings whose slug already ends in `_<n>`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `SECTION_MARKER`: drop the leading `^(.*?)` and search unanchored, with lookbehinds `(?<!;)(;*)(?<!-)` so a match starts only where a run of `;`/`-` starts; that is the same first match the lazy prefix found. Take the text before the marker from `marker.index`.
2. Anchors: remember per taken slug the next suffix to try (`nextSuffix` map), so repeats of one heading do not count up from `_1` again.
3. Tests: 200,000 dashes through `resolveIncludes` under 1 s; 8,000 identical headings through `chunkPage` under 3× the time of 8,000 distinct ones (relative, so a slow machine does not flake it).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before the fix (Node 24.22.1, under test load): the dashes test took 40 s, the repeated-headings test 17 s. After: 5 ms and about 1.5 s for 8,000 repeated vs about 1 s for distinct headings. An absolute time limit for the heading test was too close (1.5 s vs 3 s), hence the relative check. Existing anchor and section tests (MkDocs anchors incl. `Rollback_1`, `_1`/`_2`, markers inside comments, escaped `;--8<--`) pass unchanged. `make lint` and `make test` (629 tests) pass.

Follow-up: the repeated-headings test exceeded vitest 5 s under full-suite load with 8,000 headings; reduced to 5,000 per side (quadratic numbering is still about 7 times slower than distinct headings there) with a 30 s test timeout.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both parser paths a docs branch could drive into quadratic time are linear now. `SECTION_MARKER` in `parsing/include.ts` no longer has the leading `^(.*?)`; lookbehinds start a match only at the start of a `;`/`-` run, which is the same match as before, so markers are recognized exactly as before. `parsing/chunk.ts` remembers the next free suffix per taken slug instead of counting up from `_1` for every repeated heading; anchors are unchanged. Regression tests in `include.spec.ts` (200,000 dashes, 40 s before, 5 ms now) and `chunk.spec.ts` (8,000 repeated vs distinct headings, 17 s before). `make lint` and `make test` pass.
<!-- SECTION:FINAL_SUMMARY:END -->

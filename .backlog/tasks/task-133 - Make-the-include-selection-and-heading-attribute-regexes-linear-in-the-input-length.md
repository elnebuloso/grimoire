---
id: TASK-133
title: >-
  Make the include selection and heading attribute regexes linear in the input
  length
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:04'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. Two regexes in the parser take time that grows with the square of their input, so one long line in a docs repository can keep the indexing worker busy for hours. (1) `SELECTION` in `app/src/lib/server/parsing/include.ts` (around line 39-40) runs on every include name (`include()` around line 106) and splits off a line-range or section suffix with a lazy `(.*?)` followed by an optional group. Measured through `resolveIncludes` with Node 24.22.1: a line `--8<-- ",:1,:1,…!"` of 12 KB takes 0.4 s, of 48 KB 6.9 s; extrapolated, 1 MB takes most of an hour. (2) `ATTRIBUTE_LIST` (`/\s*\{:?([^}]*)\}\s*$/`) in `app/src/lib/server/parsing/chunk.ts` (around line 42), used by `takeAttributeListId` on the last text node of every heading, is not anchored at the start and retries from every position: 40,000 spaces followed by a character other than `}` take 1.5 s. Docs repositories are untrusted input ("anyone who can push to a docs branch"), and an innocent generated file can hit this too. The selection syntax follows pymdownx.snippets: after the file name either line ranges such as `:4:6,-2:` or `:name` for a section.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Include names keep their current meaning: file, line ranges and section are parsed exactly as before (existing include specs pass)
- [x] #2 Heading attribute lists such as `{#id .class}` are still removed from heading text and their id used as anchor (existing chunk specs pass)
- [x] #3 A test resolves an include line of about 50 KB of `,:1` repetitions and finishes well under a second
- [x] #4 A test chunks a heading with 40,000 spaces before a closing character other than `}` and finishes well under a second
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. include.ts: replace SELECTION with splitSelection(name): split at commas, find the trailing run of later ranges, then the first range among the last two colons of a part; else a :section after the last colon; else the whole name is the file.
2. chunk.ts: replace ATTRIBUTE_LIST with parsing from the end (trimmed text ends with }, { is the first one after the previous }).
3. Fuzz both against the old regexes on random inputs; add timed tests with the adversarial inputs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fuzzed both new parsers against the old regexes on 300,000 random short strings each (alphabets with letters, colons, commas, digits, dashes, braces, hash, whitespace, newlines): 0 mismatches in file/ranges/section and in match index/attribute text.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Include names are split into file and selection by splitSelection in include.ts, and heading attribute lists are found by scanning from the end in chunk.ts; both replace regexes that were quadratic in the input length. Fuzzed against the old regexes on 300,000 random inputs each with no mismatch. New tests: a 51 KB include name and headings with 40,000 spaces or braces finish in milliseconds; against the old code they took 8.1 s and 3.3 s and fail. A further test pins the shortest-file-name rule for names with commas and colons. All 173 parsing and sync specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->

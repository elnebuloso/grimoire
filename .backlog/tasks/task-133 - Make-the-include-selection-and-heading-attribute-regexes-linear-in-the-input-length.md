---
id: TASK-133
title: >-
  Make the include selection and heading attribute regexes linear in the input
  length
status: To Do
assignee: []
created_date: '2026-10-30 10:55'
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
- [ ] #1 Include names keep their current meaning: file, line ranges and section are parsed exactly as before (existing include specs pass)
- [ ] #2 Heading attribute lists such as `{#id .class}` are still removed from heading text and their id used as anchor (existing chunk specs pass)
- [ ] #3 A test resolves an include line of about 50 KB of `,:1` repetitions and finishes well under a second
- [ ] #4 A test chunks a heading with 40,000 spaces before a closing character other than `}` and finishes well under a second
<!-- AC:END -->

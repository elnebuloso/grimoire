---
id: TASK-22
title: Include line selections and named sections
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:05:00Z'
updated_date: '2026-10-29T01:25:00Z'
labels:
  - parsing
milestone: m-1
dependencies:
  - TASK-4
references:
  - https://facelessuser.github.io/pymdown-extensions/extensions/snippets/
documentation:
  - docs/concept.md
priority: medium
type: enhancement
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
pymdownx.snippets can include part of a file instead of the whole file: by line numbers (`file.md:4:6`) or by a named section marked in the included file with `--8<-- [start:name]` / `--8<-- [end:name]`. Sections are the common way to pull a single function or config block from a source file into a code fence in the docs. `resolveIncludes` (`app/src/lib/server/parsing/include.ts`) treats the whole string as a file name, so such an include is reported as "not found" and its content is missing for agents, while the rendered MkDocs page shows it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Line selections are inserted like pymdownx.snippets: `file.md:3`, `file.md::3`, `file.md:4:6`, several ranges separated by `,`, negative indexes, `0` clamped to `1`
- [x] #2 `file.md:name` inserts only the lines between `--8<-- [start:name]` and `--8<-- [end:name]`; the marker lines are left out, also when they sit inside a comment such as `# --8<-- [start:name]`
- [x] #3 Section markers are removed from every included file, also when the whole file is included
- [x] #4 A section name that does not exist in the target is reported as a warning naming file and section
- [x] #5 Works in the single-line and the block format
- [x] #6 Unit tests cover line ranges, negative indexes, a named section, a missing section and markers inside comments
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Split an include name into path and selection with the `RE_SNIPPET_FILE` regex of pymdownx.snippets 10.x/12.x (line ranges or `:name`)
2. Apply line ranges like `parse_snippets` (1-based start, `0` -> line 1, negative from the end, several ranges joined)
3. Extract named sections like `extract_section`; warn when the section does not exist
4. Drop section marker lines (also commented ones, unescape `;`-escaped ones) outside of section extraction, in the page and every included file, as `parse_snippets` does
5. Unit tests in `include.spec.ts`, expectations checked against pymdownx 12.3 in a scratch venv
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ported from `pymdownx/snippets.py` 12.3: `RE_SNIPPET_FILE`, `RE_SNIPPET_SECTION`, the range arithmetic in `parse_snippets` and `extract_section`. Expected values in `include.spec.ts` were produced by running pymdownx 12.3 on the same files in a scratch venv (not a project dependency).

Behaviour worth knowing: `file.md:3` means line 3 to the end, and a range reaching the end keeps the empty last line pymdownx counts after a final newline. Markers are also dropped from the page itself, as pymdownx does. `dedent_subsections` (off by default) is not supported.

Handbook: row for partial includes in `docs/handbook/writing.md`. `make lint`, `make test` (257) and `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Includes accept line selections (`file.md:4:6`, `::3`, `:-2:`, several ranges with `,`, `0` as line 1) and named sections (`file.md:name`), matching pymdownx.snippets 12.3, which the tests were checked against. Section markers, also inside comments, are removed from every page and included file; `;`-escaped markers are unescaped. A missing section is a warning naming file and section. The handbook lists partial includes. Not supported: `dedent_subsections`.
<!-- SECTION:FINAL_SUMMARY:END -->

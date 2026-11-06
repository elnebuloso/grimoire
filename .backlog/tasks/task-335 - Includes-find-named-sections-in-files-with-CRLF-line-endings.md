---
id: TASK-335
title: 'Includes: find named sections in files with CRLF line endings'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/include.ts
priority: medium
type: bug
ordinal: 397000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`SECTION_MARKER` in `app/src/lib/server/parsing/include.ts` (around lines 45-46) matches `--8<-- [start:name]` / `[end:name]` marker lines and ends in `(.*)$` without the `m` flag; `.` does not match `\r`, so a marker line ending in `\r` never matches. It is used for `file.md:name` includes and to strip markers (around lines 93 and 243-265).

Case: `docs/b.md` = `x\r\n--8<-- [start:s]\r\nIN\r\n--8<-- [end:s]\r\n`, included with `--8<-- "docs/b.md:s"`: grimoire warns `include "docs/b.md" has no section "s"` and drops the content; marker lines in CRLF pages also stay in the output. pymdownx snippets strips `\r\n` per line, so MkDocs inserts `IN`. No spec contains `\r`.

Suggested fix: end the pattern with `(.*?)\r?$`, or split lines with `/\r?\n/` where markers are read.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A named section in a CRLF file is included like in an LF file
- [ ] #2 Marker lines of a CRLF page are removed from the output
- [ ] #3 Specs in `include.spec.ts` cover CRLF
<!-- AC:END -->

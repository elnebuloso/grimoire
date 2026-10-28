---
id: TASK-22
title: Include line selections and named sections
status: To Do
assignee: []
created_date: '2026-10-28T20:05:00Z'
labels:
  - parsing
milestone: m-1
dependencies:
  - TASK-4
references:
  - https://facelessuser.github.io/pymdown-extensions/extensions/snippets/
documentation:
  - docs/konzept.md
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
- [ ] #1 Line selections are inserted like pymdownx.snippets: `file.md:3`, `file.md::3`, `file.md:4:6`, several ranges separated by `,`, negative indexes, `0` clamped to `1`
- [ ] #2 `file.md:name` inserts only the lines between `--8<-- [start:name]` and `--8<-- [end:name]`; the marker lines are left out, also when they sit inside a comment such as `# --8<-- [start:name]`
- [ ] #3 Section markers are removed from every included file, also when the whole file is included
- [ ] #4 A section name that does not exist in the target is reported as a warning naming file and section
- [ ] #5 Works in the single-line and the block format
- [ ] #6 Unit tests cover line ranges, negative indexes, a named section, a missing section and markers inside comments
<!-- AC:END -->

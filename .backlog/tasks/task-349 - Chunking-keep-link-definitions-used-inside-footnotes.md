---
id: TASK-349
title: 'Chunking: keep link definitions used inside footnotes'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:10'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/chunk.ts
priority: medium
type: bug
ordinal: 411000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-337, `definitionsUsedBy` in `app/src/lib/server/parsing/chunk.ts` (around lines 196-213) copies link definitions and footnote definitions into each snippet that references them. It visits only the snippet's own nodes, not the footnote definitions it copies in, so a link definition referenced only from inside a footnote is dropped from every snippet.

Case: `## Limits\n\nUploads stop at 10 MB[^1]. …` with `[^1]: See [the quota page][quota].` and `[quota]: https://docs.example.com/quota` at the end of the page. The `limits` snippet carries the footnote with a dangling `[the quota page][quota]`; the URL appears in no snippet. Before TASK-337 the footnote stayed in the last section, which also received `[quota]`.

Suggested fix: after collecting the definitions a snippet uses, visit the collected footnote definitions for `linkReference` and `footnoteReference` as well, and repeat until nothing new is added.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A link definition referenced from a footnote is part of every snippet that carries the footnote
- [x] #2 A footnote referencing another footnote brings that one along too
- [x] #3 A spec in `chunk.spec.ts` covers both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: a footnote of the limits snippet that references a link definition and another footnote brings both along; another snippet gets neither
2. definitionsUsedBy works through a queue: every footnote definition it adds is visited for further references; each definition once
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; parsing and index-pages specs pass (125 tests).
- A footnote referencing itself or a cycle of footnotes ends, because a definition is added and visited once.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Footnotes brought into a snippet now bring along what they reference: link definitions used inside a footnote and further footnotes, each once. A URL written in a footnote no longer disappears from every snippet. Covered by a spec in chunk.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

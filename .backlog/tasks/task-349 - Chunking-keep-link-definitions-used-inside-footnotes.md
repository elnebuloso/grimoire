---
id: TASK-349
title: 'Chunking: keep link definitions used inside footnotes'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
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
- [ ] #1 A link definition referenced from a footnote is part of every snippet that carries the footnote
- [ ] #2 A footnote referencing another footnote brings that one along too
- [ ] #3 A spec in `chunk.spec.ts` covers both
<!-- AC:END -->

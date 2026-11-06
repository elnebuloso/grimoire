---
id: TASK-337
title: 'Chunking: keep footnotes with the section that references them'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/chunk.ts
priority: medium
type: bug
ordinal: 399000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Snippets are delivered on their own, so `app/src/lib/server/parsing/chunk.ts` (around lines 180-199, `takeDefinitions` / `definitionsUsedBy`) copies link definitions into every snippet that uses them. Only `definition` and `linkReference` nodes are handled; GFM `footnoteDefinition` and `footnoteReference` (remark-gfm is in use) are not.

Case: `## Limits\n\nUploads stop at 10 MB[^1].\n\n## Other\n\nText.\n\n[^1]: Larger files are rejected with HTTP 413.` – the snippet `limits` gets a dangling `[^1]`, and the snippet `other` carries the footnote text.

Suggested fix: take `footnoteDefinition` nodes out like link definitions and add each to the snippets whose `footnoteReference` names it.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A footnote definition is part of every snippet that references it
- [ ] #2 A snippet that does not reference it does not contain it
- [ ] #3 Specs in `chunk.spec.ts` cover footnotes
<!-- AC:END -->

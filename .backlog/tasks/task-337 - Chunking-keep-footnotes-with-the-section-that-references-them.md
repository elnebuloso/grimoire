---
id: TASK-337
title: 'Chunking: keep footnotes with the section that references them'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:24'
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
- [x] #1 A footnote definition is part of every snippet that references it
- [x] #2 A snippet that does not reference it does not contain it
- [x] #3 Specs in `chunk.spec.ts` cover footnotes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: a footnote defined at the end goes with the section that references it, not into the last section
2. takeDefinitions takes footnoteDefinition nodes out as well, keyed by type and identifier; definitionsUsedBy adds them to snippets with a matching footnoteReference
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; parsing and index-pages specs pass (122 tests).
- Keys carry the node type, so a footnote [^1] and a link definition [1] do not collide.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Footnote definitions are now handled like link definitions: taken out of the page and copied into every snippet that references them, so a footnote arrives with the section that uses it instead of at the end of the last section. Covered by a spec in chunk.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

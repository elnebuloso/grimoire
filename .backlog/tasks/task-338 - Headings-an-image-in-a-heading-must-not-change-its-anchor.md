---
id: TASK-338
title: 'Headings: an image in a heading must not change its anchor'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:26'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/preprocess.ts
  - app/src/lib/server/parsing/chunk.ts
priority: medium
type: bug
ordinal: 400000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`preprocessPage` in `app/src/lib/server/parsing/preprocess.ts` (around lines 131-137) replaces images with their alt text before chunking; in a heading the alt text then becomes part of the text the anchor is slugified from (`app/src/lib/server/parsing/chunk.ts`, around line 133). Python-Markdown's toc ignores images, because alt is an attribute.

Case: `## Logo ![alt text](x.png)` gives grimoire the anchor `logo-alt-text`; Python-Markdown 3.7 gives `logo`. Links written as `page.md#logo` count as dead links, and the snippet ID differs from the URL fragment of the published site. Badges and icons in headings are common.

Suggested fix: when the image's parent is a heading, remove the image instead of replacing it with its alt text (outside headings the alt text stays).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A heading with an image gets the anchor MkDocs gives it
- [x] #2 Images outside headings are still replaced by their alt text
- [x] #3 Specs cover a heading with an image and a link to its anchor
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec through preprocessPage and chunkPage: `## Logo ![alt text](x.png)` anchors `logo`, a heading with a linked badge `build`; outside headings the alt text stays
2. preprocess.ts: dropImagesInHeadings removes images from headings before images elsewhere become their alt text, and drops a link the removal left empty
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before (anchor logo-alt-text) and passes after; parsing and index-pages specs pass.
- A linked badge in a heading (`[![status](b.svg)](ci)`) leaves no empty `[](ci)` behind.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Images in headings are now removed instead of replaced by their alt text, as Python-Markdown's toc leaves them out of the anchor: `## Logo ![alt text](x.png)` anchors `logo` again, so links to it are no longer dead and the snippet ID matches the published site. A link left empty by the removal goes too; outside headings images still become their alt text. Covered by a spec in preprocess.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

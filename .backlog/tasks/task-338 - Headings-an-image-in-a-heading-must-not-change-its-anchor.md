---
id: TASK-338
title: 'Headings: an image in a heading must not change its anchor'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 A heading with an image gets the anchor MkDocs gives it
- [ ] #2 Images outside headings are still replaced by their alt text
- [ ] #3 Specs cover a heading with an image and a link to its anchor
<!-- AC:END -->

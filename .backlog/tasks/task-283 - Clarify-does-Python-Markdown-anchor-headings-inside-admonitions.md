---
id: TASK-283
title: 'Clarify: does Python-Markdown anchor headings inside admonitions'
status: To Do
assignee: []
created_date: '2026-11-06 15:58'
labels:
  - parsing
dependencies: []
priority: medium
type: spike
ordinal: 345000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`chunkPage` assigns anchors only to top-level headings (`app/src/lib/server/parsing/chunk.ts`: `nodes.filter((node) => node.type === "heading")`). `preprocessPage` first turns an admonition into a blockquote (`parsing/preprocess.ts`), so `## Heading` inside `!!! note` is not top-level and gets no anchor, and it is not counted when repeated headings are numbered (`example`, `example_1`).

If Python-Markdown `toc` anchors headings inside admonitions (believed, not checked), then a link to such a heading is listed as a dead link (`parsing/links.ts`), and a later heading with the same text gets a different ID than on the published site, so an agent `read` with an ID from the site fails. No spec covers a heading inside an admonition.

`chunk.spec.ts` already has a table of headings with expected anchors produced by Python-Markdown 3.11 with `toc` and `attr_list`; one more row (an admonition holding a repeated heading, rendered with `admonition` too) settles the question with one Python-Markdown run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The anchors Python-Markdown (with `toc`, `attr_list`, `admonition`) gives a repeated heading inside an admonition are recorded as a row in the `chunk.spec.ts` table
- [ ] #2 If the site anchors them, `assignAnchors` takes every heading in document order while only top-level ones become sections, and the row passes
- [ ] #3 If it does not, the row documents that and nothing else changes
<!-- AC:END -->

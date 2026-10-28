---
id: TASK-24
title: Reference-style links lose their URL when the definition is in another snippet
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:10:00Z'
updated_date: '2026-10-28T20:15:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-5
documentation:
  - docs/konzept.md
priority: medium
type: bug
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reference-style links (`[docs][rb]` with `[rb]: https://…` elsewhere on the page) are common in hand-written Markdown, and the definitions usually sit at the end of the page. `chunkPage` (`app/src/lib/server/parsing/chunk.ts`) keeps a definition as a node at its position, so it ends up in the snippet of the last section, while the reference stays in its own snippet. Snippets are delivered on their own, so the agent sees `[docs][rb]` without any URL, and `resolveLinks` (`app/src/lib/server/parsing/links.ts`) records the link under the wrong snippet anchor. Reproduced: a page with `## A` holding `[docs][rb]` and `## B` followed by the definition yields snippet `a` without the URL and snippet `b` with it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A snippet containing a reference-style link also contains the definition with its URL, wherever the definition stands on the page
- [x] #2 A snippet without references carries no definitions of other sections
- [x] #3 Link records from `resolveLinks` for reference-style links carry the anchor of the snippet holding the reference
- [x] #4 A regression test reproduces the case of a definition at the end of the page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In `chunkPage`, take every `definition` node out of the parsed page (also nested ones; the first definition of a label wins, as in CommonMark).
2. When a snippet part is stringified, append the definitions of the `linkReference` labels used in that part, each once.
3. Regression test in `chunk.spec.ts` for a definition at the end of the page; test in `links.spec.ts` that the link record carries the anchor of the referencing snippet.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`chunkPage` (`app/src/lib/server/parsing/chunk.ts`) now takes every link definition out of the page (first one per label wins) and appends to each snippet part the definitions its reference links use, each once. Snippets without references get none. As a result `resolveLinks` sees the definition in the referencing snippet and records the link under its anchor. The regression test in `chunk.spec.ts` (definition at the end of the page, used by two sections, label case differing) failed before the fix; a test in `links.spec.ts` covers the link record anchor. `make test` (55 tests) and `make lint` pass. Definitions are added after the 800-token split, so a part can exceed the limit by the length of its definitions.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-24
title: Reference-style links lose their URL when the definition is in another snippet
status: To Do
assignee: []
created_date: '2026-10-28T20:10:00Z'
updated_date: '2026-10-28T20:11:00Z'
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
- [ ] #1 A snippet containing a reference-style link also contains the definition with its URL, wherever the definition stands on the page
- [ ] #2 A snippet without references carries no definitions of other sections
- [ ] #3 Link records from `resolveLinks` for reference-style links carry the anchor of the snippet holding the reference
- [ ] #4 A regression test reproduces the case of a definition at the end of the page
<!-- AC:END -->

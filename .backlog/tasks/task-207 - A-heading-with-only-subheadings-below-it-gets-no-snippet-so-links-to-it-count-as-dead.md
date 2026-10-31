---
id: TASK-207
title: >-
  A heading with only subheadings below it gets no snippet, so links to it count
  as dead
status: To Do
assignee: []
created_date: '2026-10-31 01:41'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/chunk.ts
  - app/src/lib/server/parsing/links.ts
  - app/src/lib/server/search/query.ts
priority: high
type: bug
ordinal: 269000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A common page shape is a heading without text of its own, followed only by subheadings:

```markdown
# Setup

Intro text …

## Install

### Linux

…

### macOS

…
```

MkDocs renders the anchor `#install`, but `collectSnippets` in `app/src/lib/server/parsing/chunk.ts` (around lines 191-218) emits a snippet only for sections that have content of their own (`splitAtBlocks(section.nodes)` returns no parts for `## Install`), and the anchor is not added as an alias anywhere either. As a result:

- `resolveLinks` in `app/src/lib/server/parsing/links.ts` marks a link to `setup.md#install` as dead (`hasAnchor` finds neither an anchor nor an alias), so it shows up under dead links in the management area and is not rewritten into a grimoire ID.
- `read setup#install` (MCP) and `GET /p/<source>/setup?section=install` answer "not found" (`readSnippets` in `app/src/lib/server/search/query.ts` matches `snippets.anchor` or `snippets.aliases`).
- The `index` operation does not list the heading.

Verified with a script against the real `chunkPage` and `resolveLinks`: the page above yields the snippets overview, `linux` and `macos`, no aliases, and a link `[install](setup.md#install)` from another page comes back as `{ target: 'setup#install', dead: true }`. Not covered by `chunk.spec.ts` or `links.spec.ts`. Small sections merged into their parent already work through `aliases` (`mergeSmallSections`), which reading, link checking and search all honour.

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The anchor of a heading that has subheadings but no content of its own is found by `read` and by `GET /p/<source>/<page>?section=<anchor>`
- [ ] #2 A link to such an anchor, from the same page or another page of the source, is not reported as dead and is rewritten into a grimoire ID
- [ ] #3 Nested cases work too: a chain of headings without own content above the first heading with content
- [ ] #4 Anchors and snippets of pages without such headings stay unchanged
- [ ] #5 Tests in `app/src/lib/server/parsing/chunk.spec.ts` and `app/src/lib/server/parsing/links.spec.ts` cover the page shape above and fail before the fix
<!-- AC:END -->

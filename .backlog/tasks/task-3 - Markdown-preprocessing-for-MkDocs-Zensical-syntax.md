---
id: TASK-3
title: Markdown preprocessing for MkDocs/Zensical syntax
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source path may hold plain Markdown or docs written for MkDocs/Zensical. Plain Markdown is the base case and passes through; MkDocs/Zensical extensions that plain Markdown parsers do not understand (admonitions, content tabs) are converted where present. Agents must receive plain Markdown, without losing warnings or tab contents, and without noise like image URLs or HTML comments.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Frontmatter is parsed into title, description and tags and removed from the text
- [x] #2 Admonitions (`!!! warning "Achtung"`) become `> **Achtung:** …` with their content kept
- [x] #3 Content tabs (`=== "Linux"`) become `**Linux:**` with their content kept
- [x] #4 Images keep their alt text, the URL is dropped
- [x] #5 HTML comments are removed; Mermaid blocks stay code blocks
- [x] #6 Unit tests cover each element with a sample page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add deps: unified, remark-parse, remark-gfm, remark-stringify, unist-util-visit, yaml, @types/mdast
2. `app/src/lib/server/parsing/preprocess.ts`: `preprocessPage(source)` → { title, description, tags, markdown }
3. Text pass: frontmatter via `yaml`; admonitions/tabs line-based (indented body, recursive, skip code fences)
4. mdast pass: images → alt text, HTML comments removed, stringify with pinned options
5. Spec with a sample page, a plain Markdown page that passes unchanged, and edge cases
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`preprocessPage(source)` in `app/src/lib/server/parsing/preprocess.ts`. Admonitions/tabs are converted on text before parsing (indented bodies would otherwise become code blocks); images and comments on the mdast tree; output re-stringified with remark (`bullet: '-'`). Verified: `make test` 16 passed (15 new in `preprocess.spec.ts`), `make lint` clean. No `format` make target exists yet; ran `npx prettier --write` directly once.

Follow-up in the same task: HTML images handled too – `<img>` becomes its `alt` text (quoted, single-quoted or unquoted), `<img>` without alt and `<picture>` `<source>` tags are dropped. 18 tests pass, `make lint` clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `preprocessPage`, which turns a page into plain Markdown plus metadata (title, description, tags from frontmatter). Plain Markdown passes through unchanged (tested); MkDocs/Zensical admonitions (`!!!`, `???`, `???+`, default and empty titles, nested) become `> **Label:** …`, content tabs become `**Label:**` paragraphs, image URLs and HTML comments are dropped, code blocks incl. Mermaid stay untouched. Invalid frontmatter throws so the sync can report a per-file warning. Not covered: HTML `<img>` tags; title fallback to the first heading is TASK-5.
<!-- SECTION:FINAL_SUMMARY:END -->

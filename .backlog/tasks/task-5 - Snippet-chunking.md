---
id: TASK-5
title: Snippet chunking
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T19:57:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-3
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents never get whole doc sets, only sections within a token budget, so every page is split into snippets that are understandable on their own. IDs and anchors must match the rendered MkDocs page so agents and humans refer to the same places. The exact rules are in the section "Zerlegung in Snippets" of `docs/konzept.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every heading with its section becomes a snippet carrying its title path (`project › source › … › heading`), file and anchor
- [x] #2 Text under `#` before the first `##` becomes the snippet "Overview" and the page description when frontmatter has none
- [x] #3 Snippets over ~800 tokens are split at subheadings, then at paragraph boundaries, never inside code blocks, tables or lists; parts are named `Heading (1/2)`, `Heading (2/2)`; a single code block that is too long stays whole
- [x] #4 Snippets under ~50 tokens are merged into their parent section
- [x] #5 Tokens are estimated as characters / 4
- [x] #6 Anchors are generated like MkDocs, including `_1`, `_2` for duplicate headings; tests compare against anchors MkDocs produces for the same headings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/parsing/chunk.ts`: `chunkPage(page, location)`, `estimateTokens`, `slugify`
2. Anchors like Python-Markdown `toc` default slugify + `unique()` (`_1`, `_2`), H1 counted, trailing `{#id}` honoured
3. Section tree by heading depth; overview before first `##`; page title frontmatter > H1 > file name
4. Merge sections < 50 tokens bottom-up into parent (anchor kept as alias)
5. Split > 800 tokens at top-level block boundaries, parts `(1/2)`; code/table/list never cut
6. Tests incl. anchors pinned from a real Python-Markdown run
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`chunkPage(page, location)` in `app/src/lib/server/parsing/chunk.ts`; shared remark parse/stringify moved to `markdown.ts` (also used by `preprocess.ts`). Decisions: page description falls back to the first paragraph of the overview (not the whole overview); merged subsections keep their anchors as `aliases` so `read`/links to them resolve to the parent snippet; split parts share the anchor. Expected anchors in `chunk.spec.ts` were generated with Python-Markdown 3.11 (`toc` + `attr_list`) in a throwaway venv. Zensical uses the same `toc` extension (Zensical docs, compatibility/markdown/python-markdown.md); custom `toc.slugify` is out of scope for v1 (user decision) → TASK-21 in milestone Version 2, limitation noted in `docs/konzept.md`. Verified: `make test` 30 passed, `make lint` clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `chunkPage`, which splits a preprocessed page into snippets with title path (`project › source › page title › … › heading`), file, MkDocs-compatible anchor and token estimate (chars / 4). Text before the first `##` becomes the "Overview" snippet; sections under 50 tokens merge into their parent (anchors kept as aliases); sections over 800 tokens split at block boundaries into `(1/2)` parts without cutting code blocks, tables or lists. Anchors are pinned against a real Python-Markdown run, including duplicates, umlauts, emoji and `{#id}`. Follow-up: TASK-21 (custom `toc.slugify`, v2).
<!-- SECTION:FINAL_SUMMARY:END -->

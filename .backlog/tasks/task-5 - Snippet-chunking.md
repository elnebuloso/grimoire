---
id: TASK-5
title: Snippet chunking
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
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
- [ ] #1 Every heading with its section becomes a snippet carrying its title path (`project › source › … › heading`), file and anchor
- [ ] #2 Text under `#` before the first `##` becomes the snippet "Overview" and the page description when frontmatter has none
- [ ] #3 Snippets over ~800 tokens are split at subheadings, then at paragraph boundaries, never inside code blocks, tables or lists; parts are named `Heading (1/2)`, `Heading (2/2)`; a single code block that is too long stays whole
- [ ] #4 Snippets under ~50 tokens are merged into their parent section
- [ ] #5 Tokens are estimated as characters / 4
- [ ] #6 Anchors are generated like MkDocs, including `_1`, `_2` for duplicate headings; tests compare against anchors MkDocs produces for the same headings
<!-- AC:END -->

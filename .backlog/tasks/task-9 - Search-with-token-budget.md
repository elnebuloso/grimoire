---
id: TASK-9
title: Search with token budget
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T20:00:00Z'
labels:
  - search
milestone: m-0
dependencies:
  - TASK-2
  - TASK-5
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`query` is the main entry point for agents. Internal docs are full of names and commands where full-text search hits well, and agents must receive as much relevant content as fits into a token budget, plus a hint about what did not fit so they can `read` it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Search uses FTS5 BM25 with weights: title path strong, text normal, code weak
- [ ] #2 Without a project all projects are searched; with a project only that project
- [ ] #3 Results are packed in ranking order until the budget (default 3000 tokens) is full; a result that does not fit is skipped and the next one tried
- [ ] #4 The result ends with a line listing the IDs of hits that did not fit
- [ ] #5 Search can be limited to the projects an API key may see
- [ ] #6 Tests cover ranking weights, budget packing and the skipped-IDs line
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: `Snippet.tokens` counts only the content. The rendered output adds title path, `Source:` and `Edit:` lines; the budget must include them.
<!-- SECTION:NOTES:END -->

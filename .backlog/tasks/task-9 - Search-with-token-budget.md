---
id: TASK-9
title: Search with token budget
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T21:32:00Z'
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
- [x] #1 Search uses FTS5 BM25 with weights: title path strong, text normal, code weak
- [x] #2 Without a project all projects are searched; with a project only that project
- [x] #3 Results are packed in ranking order until the budget (default 3000 tokens) is full; a result that does not fit is skipped and the next one tried
- [x] #4 The result ends with a line listing the IDs of hits that did not fit
- [x] #5 Search can be limited to the projects an API key may see
- [x] #6 Tests cover ranking weights, budget packing and the skipped-IDs line
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module `app/src/lib/server/search/query.ts` with `searchSnippets(db, { query, project?, allowedProjects?, tokens = 3000 })` returning the Markdown answer as a string.
2. Turn the agent's question into an FTS5 expression: split into words, quote each, join with OR. Raw input breaks FTS5 (`auth-service` -> 'no such column', `?` and `=` -> syntax error); OR keeps natural-language questions matching, BM25 ranks hits with more terms higher.
3. Rank with `bm25(snippets_fts, 10, 1, 0.25)` (title path, text, code), join snippets -> pages -> sources -> projects, filter by `project` slug and by `allowedProjects` (API key scope, TASK-11 passes it), consider the best 20 hits.
4. Render each hit in the format of `docs/konzept.md`: `### <title path>`, `Source: <id>`, `Edit: <git url via redactUrl> (<branch>) <path/file>`, blank line, content. The renderer lives here because the budget must count the rendered block; TASK-10 reuses it.
5. Pack in rank order: add a block if `estimateTokens` of it fits the remaining budget, otherwise skip it and try the next. Finish with one line listing the IDs of the skipped hits (omitted when nothing was skipped).
6. Tests in `query.spec.ts` on a temp database filled via `chunkPage` + `replaceSourceIndex`: title outranks text outranks code, project filter, allowedProjects filter, packing skips an oversized hit and takes a later smaller one, skipped-IDs line, questions with `-`, `?`, `=` do not throw.
7. `make test` and `make lint`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: `Snippet.tokens` counts only the content. The rendered output adds title path, `Source:` and `Edit:` lines; the budget must include them.

Handoff from TASK-2: `snippets_fts` columns are `title_path`, `text`, `code` in that order, so weights go to `bm25(snippets_fts, <title>, <text>, <code>)`; `rowid` is the snippet id. Default tokenizer `unicode61` splits `auth-service` into `auth` and `service`.

Weights 10/1/0.25 are a starting point; the test pins only the order title > text > code (inverting the weights fails it). At most 20 hits are considered.

Handoff to TASK-10: `renderSnippet(hit)` in `app/src/lib/server/search/query.ts` renders the `docs/konzept.md` block (title path, `Source:`, `Edit:` without credentials); reuse it for `read`. `searchSnippets` returns '' when nothing matches or the question has no words; the 'no results' message is TASK-10's. The skipped line reads `Did not fit: <id>, <id>`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `searchSnippets` in `app/src/lib/server/search/query.ts`: FTS5 BM25 search with title path weighted above text above code, optional `project` and `allowedProjects` filters, packing of rendered hits into a token budget (default 3000) in ranking order, skipping hits that do not fit and listing their IDs on a final line. Questions are split into quoted words joined with OR, so FTS5 syntax characters cannot break the query. Verified by 7 tests in `query.spec.ts`; `make test` (116 passed) and `make lint` are green.
<!-- SECTION:FINAL_SUMMARY:END -->

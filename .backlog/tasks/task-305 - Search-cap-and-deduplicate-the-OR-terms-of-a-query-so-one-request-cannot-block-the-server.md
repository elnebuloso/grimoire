---
id: TASK-305
title: >-
  Search: cap and deduplicate the OR terms of a query so one request cannot
  block the server
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
labels:
  - search
  - agent-api
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/operations.ts
priority: high
type: bug
ordinal: 367000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`toMatchExpression` in `app/src/lib/server/search/query.ts` turns a question into an FTS5 `MATCH` by quoting every word (`[\p{L}\p{N}_]+`) and joining them with ` OR `. Words are neither deduplicated nor capped; the only limit is the 500-character question length (`MAX_QUESTION_LENGTH`).

Case: `GET /query?q=a%20a%20a%20…` (500 characters) becomes 250 `"a"` phrases. Measured on an in-memory FTS5 table with 50k snippets of 150 words, with the production `ORDER BY bm25(…,10,1,0.25) LIMIT 20`: 1 term 60 ms, 20 terms 0.9 s, 40 terms 2.5 s, 250 duplicated `"the"` 83 s. `node:sqlite` runs synchronously on the single Node thread, so every page, MCP call and API request waits for that time. No key is needed: `/query`, `/mcp` (`query` tool) and the start page `/?q=` all reach it as soon as one source is public, and the agent read path has no rate limit.

Suggested fix: deduplicate the words case-insensitively and keep only the first ~16–20 before building the expression, e.g. `[...new Set(words.map((w) => w.toLowerCase()))].slice(0, 16)`. Ranking quality for normal questions is unaffected; check whether the handbook (`docs/handbook/agents.md`) should name the cap.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A question repeating one word many times produces a single MATCH term for it
- [ ] #2 A question with more distinct words than the cap searches only the first words up to the cap, and the cap is a named constant
- [ ] #3 A spec in `query.spec.ts` (or the search spec) covers deduplication and the cap through the public search function
- [ ] #4 Ordinary multi-word questions still return the same top hits as before (existing search specs pass)
<!-- AC:END -->

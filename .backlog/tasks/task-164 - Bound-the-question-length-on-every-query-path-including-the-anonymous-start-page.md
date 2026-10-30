---
id: TASK-164
title: >-
  Bound the question length on every query path, including the anonymous start
  page
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - search
milestone: m-0
dependencies: []
priority: high
type: bug
ordinal: 226000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Questions are capped at 500 characters because every word becomes an FTS5 `OR` term. The cap lives only in `agentQuery` (`app/src/lib/server/agent/operations.ts`). `answerQueryForm` (`app/src/lib/server/query-form.ts`), used by **Try a query** on `/` and by `/manage/query`, calls `querySources` directly and only trims. `/` is open without a login while one source is public. `MATCH` runs over the whole `snippets_fts` before the scope filter, and `node:sqlite` is synchronous on the server thread. Measured with a standalone script (Node 24.22.1, 20,000 snippets, the ranking and `LIMIT 20` of `searchSnippets`, every term matching): 100 terms 30 ms, 1,000 terms 0.7 s, 3,000 terms (about 32 KB, still inside the 16 KiB header limit for short words) 4.8 s. A few anonymous `GET /?q=…` requests stall the instance for every agent and admin. The handbook (`docs/handbook/agents.md`) also promises that **Try a query** shows what an agent without a key gets, which is false for questions over 500 characters.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every caller of `querySources` gets the same trimming and the same 500-character cut
- [ ] #2 A question over 500 characters on the start page searches only its first 500 characters, as over MCP and HTTP
- [ ] #3 A test sends a question over 500 characters through the start page form and checks that only the first 500 are searched
<!-- AC:END -->

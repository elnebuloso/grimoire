---
id: TASK-85
title: >-
  Return agent HTTP validation errors and unexpected errors as Markdown from
  agentResponse
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 01:34'
updated_date: '2026-10-30 01:52'
labels:
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/agent/http.ts
  - app/src/routes/query/+server.ts
  - 'app/src/routes/p/[project]/query/+server.ts'
priority: low
type: enhancement
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`agentResponse` in `app/src/lib/server/agent/http.ts` accepts `OperationResult | Response`, so that `queryOptions` can hand back a 400. Every route that validates input repeats `options instanceof Response ? options : …` – today `app/src/routes/query/+server.ts` and `app/src/routes/p/[project]/query/+server.ts`; the next route with a parameter adds a third. It is the pattern every new operation copies.

Separately, `markdownResponse` is documented as "the only format the agent HTTP API answers in", but a thrown error (a locked or corrupt database) ends in SvelteKit's default error response, while over MCP the SDK turns the same exception into a tool error in its own wording. The two adapters disagree on what an agent sees when something fails.

Possible shapes: validate the query parameters inside `agentResponse`, or let `queryOptions` throw a typed error that `agentResponse` turns into the Markdown 400. Unexpected errors are caught there too, logged (`app/src/lib/server/log.ts`), and answered with a Markdown 500.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Routes no longer check `instanceof Response`; `agentResponse` takes only operation results
- [x] #2 Invalid query parameters still answer 400 with a Markdown body
- [x] #3 An unexpected error in an operation is logged and answered with a Markdown 500, covered by a test
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `queryOptions` throws `InvalidRequestError` (http.ts) instead of returning a Response.
2. `agentResponse` takes only operations returning `OperationResult`, wraps scope lookup and operation in try/catch: `InvalidRequestError` -> Markdown 400, anything else -> `log.error` + Markdown 500.
3. Routes drop the `instanceof Response` check.
4. Test per route: closed database -> Markdown 500, logged once.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The MCP side is unchanged: the SDK still words a thrown tool error itself, which the task did not cover. The new test failed on the old code for all 7 routes. 443 server tests and make lint pass; agent environment: missing `q` and `tokens=0` answer the Markdown 400s.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Agent HTTP routes no longer pass a `Response` through the operation result: `queryOptions` throws `InvalidRequestError`, which `agentResponse` turns into the Markdown 400, and any other error is logged and answered with a Markdown 500. The "only Markdown" claim now holds for failures too. Verified by a new per-route test (fails on the old code), the full server suite, make lint and curl against the agent environment. MCP error wording is still the SDK's.
<!-- SECTION:FINAL_SUMMARY:END -->

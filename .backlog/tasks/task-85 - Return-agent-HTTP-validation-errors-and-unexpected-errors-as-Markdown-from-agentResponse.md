---
id: TASK-85
title: >-
  Return agent HTTP validation errors and unexpected errors as Markdown from
  agentResponse
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
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
- [ ] #1 Routes no longer check `instanceof Response`; `agentResponse` takes only operation results
- [ ] #2 Invalid query parameters still answer 400 with a Markdown body
- [ ] #3 An unexpected error in an operation is logged and answered with a Markdown 500, covered by a test
<!-- AC:END -->

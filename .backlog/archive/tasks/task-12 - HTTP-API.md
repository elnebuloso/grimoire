---
id: TASK-12
title: HTTP API
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-10
  - TASK-11
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents without MCP access grimoire via curl or WebFetch, so the API answers in Markdown rather than JSON. HTTP clients never send the URL fragment, so a single section is requested with `?section=` instead of `#`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Routes exist: `GET /projects`, `/query?q=&tokens=`, `/p/<project>/index`, `/p/<project>/llms.txt`, `/p/<project>/query?q=&tokens=`, `/p/<project>/<source>/<page>` with optional `?section=<anchor>`, `/instructions`
- [x] #2 Responses are Markdown with `Content-Type: text/markdown`
- [x] #3 All routes require `Authorization: Bearer <key>` and respect the key scope
- [x] #4 Unknown projects, pages or sections return 404 with a short Markdown message
- [x] #5 Tests cover each route
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shared helper app/src/lib/server/agent/http.ts: agentResponse reads the Bearer key, scopeForKey -> undefined = 401 (WWW-Authenticate: Bearer); runs the operation with the scope; found -> 200, else 404 with the same Markdown; Content-Type text/markdown. queryOptions: q required, tokens optional positive integer, else 400 (after auth).
2. llmsTxt operation in operations.ts (llmstxt.org format: # project, > description, ## source, - [title](<origin>/p/project/source/page), segments URL-encoded), pages only.
3. Routes under app/src/routes: projects, query, instructions, p/[project]/index, p/[project]/llms.txt, p/[project]/query, p/[project]/[source]/[...page] with ?section= -> #anchor.
4. Tests in http.spec.ts calling each route's GET with a mocked database() returning an in-memory db: auth, scope, 404, section, encoded IDs, 400.
5. make api-key target (scripts/create-api-key.ts) to create a key until TASK-17; separate chore commit.
6. make test, make lint, make build + curl /instructions against the built server.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: /p/<project>/llms.txt follows llmstxt.org - pages only, absolute links to the HTTP page routes. A make api-key target creates keys until the admin area (TASK-17) exists.

Tests call each route's GET directly (app/src/routes/agent-api.spec.ts) with database() mocked to an in-memory db, since the real accessor reads DATABASE_PATH from $app/env/private. Verified against the production build (make build, node build): /instructions serves the ?raw-imported text, 401 without key with WWW-Authenticate: Bearer, 404 and 400 in Markdown. make api-key opens the db with plain DatabaseSync, so it needs a database the server has migrated once.

Handoff to TASK-13: auth and status mapping live in agentResponse (app/src/lib/server/agent/http.ts); MCP calls scopeForKey and the operations directly. make api-key gives a real key for the MCP client test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the agent HTTP API: seven GET routes under app/src/routes (projects, query, instructions, p/[project]/index, p/[project]/llms.txt, p/[project]/query, p/[project]/[source]/[...page] with ?section=) over the operations in agent/operations.ts. agentResponse in agent/http.ts checks the Bearer key via scopeForKey (401 + WWW-Authenticate otherwise), maps found:false to 404 and answers text/markdown; queryOptions rejects a missing q or a non-positive tokens with 400. New llmsTxt operation lists a project's pages in llmstxt.org format with absolute, URL-encoded links to the page routes. Added make api-key (scripts/create-api-key.ts) to create keys until TASK-17. make test (166 passed), make lint green; checked by curl against the production build.
<!-- SECTION:FINAL_SUMMARY:END -->

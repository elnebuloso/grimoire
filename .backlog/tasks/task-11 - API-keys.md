---
id: TASK-11
title: API keys
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T21:47:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-2
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents authenticate with API keys. grimoire only reads, so a key needs no roles, only a project scope: all projects or a selection. A leaked database must not leak usable keys.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Only a hash of the key is stored; the plain key exists only at creation
- [x] #2 A key is scoped to all projects or a selection of projects
- [x] #3 A project outside the scope behaves exactly like a project that does not exist
- [x] #4 Requests without a valid key are rejected
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module `app/src/lib/server/api-keys.ts`: `createApiKey(db, name, projects)` returns `{ id, key }` once; key `grimoire_` + 32 random bytes base64url; only its SHA-256 (hex) is stored in `key_hash`. Unknown project slug throws, nothing stored (one transaction).
2. `listApiKeys(db)`: id, name, createdAt, scope (`'all'` or slugs), never the key or hash.
3. `revokeApiKey(db, id)`: DELETE, `api_key_projects` cascades; no cache, so it stops working immediately.
4. `scopeForKey(db, key)`: `{ scope: ProjectScope } | undefined`; undefined = reject. HTTP (TASK-12) and MCP (TASK-13) turn that into 401.
5. Tests in `api-keys.spec.ts`; `make test`, `make lint`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revoking deletes the row (no revoked_at history, no migration). Keys are hashed with SHA-256, not a slow hash: they are 256 random bits, not chosen passwords.

Handoff to TASK-12/13: read the bearer token, call `scopeForKey(db, token)`; `undefined` -> 401, otherwise pass `.scope` to the operations in `agent/operations.ts`. Handoff to TASK-17: `createApiKey` is the only place the plain key exists - show it once after creation; `listApiKeys` and `revokeApiKey` back the list and revoke actions. A key with an empty selection is allowed and sees nothing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `app/src/lib/server/api-keys.ts`: `createApiKey` (name + all projects or a slug selection, returns the `grimoire_…` key once, stores only its SHA-256, rejects unknown projects atomically), `listApiKeys` (name, created, scope; no key or hash), `revokeApiKey` (delete, effective immediately) and `scopeForKey` (key -> `ProjectScope`, or undefined to reject). Rejecting requests over HTTP/MCP follows in TASK-12/13 via `scopeForKey`. 9 tests in `api-keys.spec.ts`; `make test` (137 passed) and `make lint` green.
<!-- SECTION:FINAL_SUMMARY:END -->

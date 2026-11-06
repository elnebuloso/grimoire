---
id: TASK-319
title: >-
  API keys: a new key must not inherit unwritten request counts of a deleted key
  with the same id
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:25'
labels:
  - admin
  - agent-api
dependencies: []
references:
  - app/src/lib/server/api-keys.ts
  - app/src/lib/server/admin/users.ts
priority: low
type: bug
ordinal: 381000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/api-keys.ts` counts requests per key in memory (`unwrittenRequests` / `unwrittenFor(db)`) and writes them at most once a minute. Only `revokeApiKey` clears a key's in-memory counts. `deleteUser` in `app/src/lib/server/admin/users.ts` removes a user's keys through `ON DELETE CASCADE`, so their unwritten counts stay in memory. `api_keys.id` is `INTEGER PRIMARY KEY` without `AUTOINCREMENT`, so SQLite reuses the highest id after it is deleted.

Case: Bob owns the newest key, id 42, and his agent made 200 requests in the last minute. An admin deletes Bob. Alice creates a key, which gets id 42 again: its usage shows Bob's 200 requests for today, and her first use writes them into `api_key_requests`. No security impact; a wrong usage chart.

Suggested fix: clear the in-memory counts for the new id in `createApiKey` right after the insert.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A key created with the id of a deleted key starts with no requests counted
- [x] #2 A spec covers deleting a user with unwritten counts and creating a key that reuses the id
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: a key deleted with its owner leaves counts; a new key reusing its id starts empty and writes only its own request
2. createApiKey drops the in-memory counts of the new id
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before (the new key showed the 3 requests of the deleted one) and passes after; api-keys.spec.ts passes (31 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A new API key that gets the id of a key deleted together with its owner no longer inherits that key's unwritten request counts: createApiKey drops the in-memory counts for the new id. Covered by a spec in api-keys.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

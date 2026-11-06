---
id: TASK-319
title: >-
  API keys: a new key must not inherit unwritten request counts of a deleted key
  with the same id
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 A key created with the id of a deleted key starts with no requests counted
- [ ] #2 A spec covers deleting a user with unwritten counts and creating a key that reuses the id
<!-- AC:END -->

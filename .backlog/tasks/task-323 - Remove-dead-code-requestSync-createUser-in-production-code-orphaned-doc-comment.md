---
id: TASK-323
title: >-
  Remove dead code: requestSync, createUser in production code, orphaned doc
  comment
status: To Do
assignee: []
created_date: '2026-11-06 20:52'
labels:
  - sync
  - admin
dependencies: []
references:
  - app/src/lib/server/sync/index.ts
  - app/src/lib/server/auth/auth.ts
  - app/src/lib/server/api-keys.ts
priority: low
type: chore
ordinal: 385000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Code that serves no production path:

- `requestSync` in `app/src/lib/server/sync/index.ts` (`export const requestSync = queue.request;`) has no caller anywhere in the repository; only `requestSyncInBackground` is used.
- `createUser` in `app/src/lib/server/auth/auth.ts` is used only by specs (`auth.spec.ts`, `password-reset.spec.ts`, `app/src/routes/access.spec.ts`, `app/src/routes/login/password-reset.spec.ts`). Production creates users through setup, invitations and OIDC. As production code it skips the `looksLikeEmail` check every real path applies; it belongs in a spec helper.
- `revokeApiKey` in `app/src/lib/server/api-keys.ts` carries two stacked doc comments; the first is an orphan.

Grep the whole tree (including `scripts/`) again before removing.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `requestSync` is gone and nothing imports it
- [ ] #2 `createUser` is no longer exported from production code; the specs use a test helper
- [ ] #3 `revokeApiKey` has one doc comment
- [ ] #4 `make lint` and the affected specs pass
<!-- AC:END -->

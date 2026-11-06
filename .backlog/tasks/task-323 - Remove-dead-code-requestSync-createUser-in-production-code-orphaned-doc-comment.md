---
id: TASK-323
title: >-
  Remove dead code: requestSync, createUser in production code, orphaned doc
  comment
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:52'
updated_date: '2026-11-06 21:37'
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
- [x] #1 `requestSync` is gone and nothing imports it
- [x] #2 `createUser` is no longer exported from production code; the specs use a test helper
- [x] #3 `revokeApiKey` has one doc comment
- [x] #4 `make lint` and the affected specs pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove requestSync from sync/index.ts (grep: no caller in app/src or scripts)
2. Move createUser into app/src/lib/server/auth/test-user.ts (relative .ts imports for the e2e test), switch auth.spec, password-reset.spec, access.spec, login/password-reset.spec and manage.e2e.ts to it
3. Merge the two doc comments of revokeApiKey
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The specs that used createUser, api-keys.spec.ts and queue.spec.ts pass (141 tests); make lint passes (0 errors).
- manage.e2e.ts is covered by the e2e run before the push.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the unused requestSync export, moved createUser, which only tests used and which skipped the address check of every real path, out of auth.ts into a test helper test-user.ts, and merged the two stacked doc comments of revokeApiKey. All callers in specs and the e2e test use the helper; the affected specs and make lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->

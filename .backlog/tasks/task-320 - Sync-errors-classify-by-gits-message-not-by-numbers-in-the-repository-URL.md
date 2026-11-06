---
id: TASK-320
title: 'Sync errors: classify by git''s message, not by numbers in the repository URL'
status: To Do
assignee: []
created_date: '2026-11-06 20:52'
labels:
  - sync
dependencies: []
references:
  - app/src/lib/server/sync/git.ts
  - app/src/lib/server/sync/error-kind.ts
priority: low
type: bug
ordinal: 382000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The error kind decides which fix hint an admin sees (`SYNC_FIX` in `app/src/lib/sync-fix.ts`). In `app/src/lib/server/sync/git.ts` the `REFUSED` pattern matches `\b40[134]\b` and "not found" anywhere in git's stderr, and git's stderr quotes the repository URL; `error-kind.ts` has the same kind of match for older errors.

Case: `https://git.example.com/web/404-pages.git` while the server is down gives "fatal: unable to access 'https://git.example.com/web/404-pages.git/': Failed to connect…", which is classified as `access`; the admin is told to fix the token. Separately, `checkRemote` discards the kind `git()` already computed (`SyncFailure.kind`) and derives it again from the text, so the two can disagree.

Suggested fix: remove the quoted URL (`'[^']*'`) from the output before testing the patterns, and let `checkRemote` use `SyncFailure.kind` when it has one.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A connection failure for a URL containing 404, 401 or 403 is classified as unreachable, not access
- [ ] #2 A real HTTP 403/404 answer of the Git server is still classified as access
- [ ] #3 `checkRemote` reports the same kind as the failing git call
- [ ] #4 Specs in `git.spec.ts` or `error-kind.spec.ts` cover the URL case
<!-- AC:END -->

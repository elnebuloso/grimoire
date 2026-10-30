---
id: TASK-102
title: 'Check access for the real management route IDs, not hand-written ones'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/hooks.server.ts
  - app/src/routes/access.spec.ts
priority: medium
type: task
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

Access is decided in `handleAccess` (`app/src/hooks.server.ts:40-47`) through `accessRedirect` (`app/src/lib/server/admin/auth.ts`, around line 296-324): a route needs a role if its route ID starts with a prefix in `PAGE_ROLES`, everything else is public. That is correct today, but the rule lives in two places, the directory layout and a string constant; the `/admin` → `/manage` rename (`7b6ce5f`) had to change both.

The access tests (`app/src/routes/access.spec.ts`, around lines 270-330) build events with route IDs typed by hand, so nothing checks the real route tree. A route group (`routes/(admin)/manage/...` turns every ID into `/(admin)/manage/...`) or an admin endpoint placed outside the prefix would be served without a login, and no unit test would fail. The e2e suite only catches the redirects it happens to visit.

A test that enumerates the real route IDs under `app/src/routes/manage/` (for example with `import.meta.glob` over the `+page`/`+server` files) and asserts that `accessRedirect` refuses each without a session keeps the prefix list and the directory in step. Making the guard fail closed (public routes listed, everything else guarded) is a larger alternative.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A test derives every route ID under `app/src/routes/manage/` (and `account`, if guarded) from the files on disk and asserts each is refused without a session
- [ ] #2 Adding a new route under `app/src/routes/manage/` is covered by that test without editing it
- [ ] #3 The test fails if the guard prefix and the directory drift apart (checked once by breaking the prefix locally)
<!-- AC:END -->

---
id: TASK-213
title: Answer a save of a source deleted during the access check with 404
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
labels:
  - admin
milestone: m-1
dependencies: []
priority: medium
type: bug
ordinal: 275000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `save` action in `app/src/routes/manage/sources/[id]/+page.server.ts` looks up the source, may then wait up to 15 s on the Git access check (`ACCESS_TIMEOUT_MS` in `app/src/lib/server/admin/source-access.ts`), and then calls `saveSource`. If another tab deletes the source during that wait, the `UPDATE` changes no row and `saveSource` throws `there is no source <id>` (`app/src/lib/server/admin/sources.ts`, ~line 302). The admin gets the bare error page with a 500, and the log records an unknown error.

The `slug` action already handles this case: `changeSourceSlug` returns `'not-found'` and the action answers `error(404)`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `saveSource` returns `'not-found'` instead of throwing when the source no longer exists
- [ ] #2 The `save` action answers `not-found` with a 404
- [ ] #3 A regression test saves a source that was deleted after the action looked it up and gets a 404
<!-- AC:END -->

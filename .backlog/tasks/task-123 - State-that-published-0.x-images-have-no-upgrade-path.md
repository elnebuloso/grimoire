---
id: TASK-123
title: State that published 0.x images have no upgrade path
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: docs
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. Releases v0.1 to v0.9 are tagged and the release config (`.releaserc`, `prepareCmd`) pushed an image to Docker Hub for each. The project nevertheless treats 0.x databases as disposable: migration `0017-user-email.sql` turns the former username into the email value, stored as typed, while `findUser` and `resetAdmin` in `app/src/lib/server/admin/auth.ts` now look addresses up lowercased via `normalizeEmail`, so an admin created as `Admin` on a release before 0.8.0 cannot log in after upgrading, and `make admin-reset` / `scripts/reset-admin.ts` cannot find the account either. TASK-29 will later squash all migrations into one, after which a 0.x database is refused outright ("database schema is at version N, this grimoire knows only 1", `app/src/lib/server/db/migrate.ts`). Decided with the user on 2026-10-30: published 0.x images are previews without an upgrade path; nobody fixes the migration, and TASK-29 stays as planned. That decision has to be written where an operator reads it, so nobody upgrades a 0.x database expecting it to work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The handbook says that 0.x releases are previews, that a database from one 0.x release is not guaranteed to work with a later one, and that the way forward is a fresh database
- [ ] #2 The same statement is reachable from where an operator starts (the README or the handbook page on running the image)
- [ ] #3 `make handbook` builds without warnings
<!-- AC:END -->

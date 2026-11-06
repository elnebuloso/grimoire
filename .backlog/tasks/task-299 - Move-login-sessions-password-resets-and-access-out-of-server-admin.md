---
id: TASK-299
title: 'Move login, sessions, password resets and access out of server/admin'
status: To Do
assignee: []
created_date: '2026-11-06 19:35'
labels:
  - admin
dependencies: []
priority: low
type: task
ordinal: 361000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/admin/` holds `auth.ts`, `access.ts` and `password-reset.ts`, which serve every user, not only admins. Decided by the owner (TASK-297, question 3): move them to `app/src/lib/server/auth/` in one pass, imports in `scripts/` and the Dockerfile included. No behaviour changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 auth.ts, access.ts and password-reset.ts (with their specs and auth-messages.ts) live in app/src/lib/server/auth/
- [ ] #2 Every import, scripts/ and the Dockerfile included, points there; auth.ts still loads in plain Node
- [ ] #3 make test, make e2e and make image-smoke pass
<!-- AC:END -->

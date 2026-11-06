---
id: TASK-299
title: 'Move login, sessions, password resets and access out of server/admin'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:35'
updated_date: '2026-11-06 19:50'
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
- [x] #1 auth.ts, access.ts and password-reset.ts (with their specs and auth-messages.ts) live in app/src/lib/server/auth/
- [x] #2 Every import, scripts/ and the Dockerfile included, points there; auth.ts still loads in plain Node
- [x] #3 make test, make e2e and make image-smoke pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git mv auth.ts, access.ts, password-reset.ts, auth-messages.ts and attempt-limit.ts with their specs from server/admin to server/auth
2. Rewrite every import (#lib alias, relative, scripts/, e2e), and the path named in ui-components.md
3. make test, make e2e, make image-smoke
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- attempt-limit.ts moved too: it limits logins and reset requests, nothing admin-only; invitations.ts stays in admin (admins invite).
- The Dockerfile copies app/src/lib/server whole, so it needed no change.
- make lint, make test (158 files, 1250 tests), make e2e (28), make image-smoke and make agent-reset pass; auth.ts loads in plain Node.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Login, sessions, password resets, access and the attempt limit now live in app/src/lib/server/auth/ instead of admin/; every import, the scripts and the rule text follow. No behaviour change; lint, full tests, e2e, image smoke and the agent seed pass.
<!-- SECTION:FINAL_SUMMARY:END -->

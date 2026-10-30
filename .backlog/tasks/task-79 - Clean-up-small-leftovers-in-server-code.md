---
id: TASK-79
title: Clean up small leftovers in server code
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/lib/server/db/links.ts
priority: low
type: chore
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

- `findBacklinks` (`app/src/lib/server/db/links.ts`) is used only by its test: either a feature never wired up or dead code.
- `searchSnippets` maps rows by hand (`app/src/lib/server/search/query.ts:72-75`) instead of using `toSnippetHit` a few lines below.
- Expired sessions are never deleted (`app/src/lib/server/admin/auth.ts:213-241`).
- `failedLogins` forgets a client only after a successful login (`auth.ts:46`).

Both of the last two grow without bound over an instance's life; harmless at today's scale, relevant once multi-user (ADR 0003) grows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `findBacklinks` is either used or removed, decided with the user
- [ ] #2 `searchSnippets` uses `toSnippetHit`
- [ ] #3 Expired sessions and stale failed-login entries are removed, with tests
<!-- AC:END -->

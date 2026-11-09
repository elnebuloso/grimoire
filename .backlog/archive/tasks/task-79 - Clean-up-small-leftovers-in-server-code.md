---
id: TASK-79
title: Clean up small leftovers in server code
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 01:02'
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
- [x] #1 `findBacklinks` is either used or removed, decided with the user
- [x] #2 `searchSnippets` uses `toSnippetHit`
- [x] #3 Expired sessions and stale failed-login entries are removed, with tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
searchSnippets uses toSnippetHit (commit f7e7a66). Expired sessions are deleted whenever a new session starts; failed-login entries are dropped once a client has had no failure for BLOCK_MINUTES and is not blocked (commit c4b1457). This means failures now count from zero after 15 quiet minutes; before, they counted forever until a successful login. Tests: auth.spec 'counts failures from zero again after 15 quiet minutes' and 'deletes expired sessions when a new one starts', both fail on the old code. AC 1 (findBacklinks) waits for the user's decision.

Decided with the user: findBacklinks is removed together with its test; git history keeps it should backlinks become a feature.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cleaned up four leftovers: findBacklinks (unused outside its test) is removed by the user's decision; searchSnippets maps rows with toSnippetHit; expired sessions are deleted when a new session starts; and failed-login entries are forgotten after 15 quiet minutes, so neither grows without bound. Verified by new auth tests (which fail on the old code), make lint and make test.
<!-- SECTION:FINAL_SUMMARY:END -->

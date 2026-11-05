---
id: TASK-239
title: End a session after 60 minutes idle or 12 hours at most
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 15:27'
updated_date: '2026-11-05 15:36'
labels:
  - admin
dependencies: []
priority: medium
type: feature
ordinal: 301000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A session lasts 12 hours from the login, whether the browser is used or left open on a shared machine. The owner decided on 2026-11-05 to end it after 60 minutes without a request as well, 12 hours at most. Reference: b66df73 (and its migration 0005-session-end) in /workspace/github.com/elnebuloso/grimoire-before-reset; the migration gets the next free number here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A session ends 60 minutes after its last request and 12 hours after the login at the latest
- [x] #2 A request extends the idle end at most once a minute; the sync poll of a source page does not extend it
- [x] #3 After a login the user returns to the page they asked for
- [x] #4 A new numbered migration adds what the schema needs; existing sessions end at the latest when they would have
- [x] #5 Specs cover idle end, maximum, the throttled extension and the poll; make test, make e2e and make lint pass; the handbook says how long a session lasts
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Taken over from b66df73 with git apply and rejects redone by hand. Migration 0005-session-end rebuilds sessions with expires_at and ends_at (CHECK expires_at <= ends_at); existing sessions end with it, their users log in again. touchSession in the access hook moves expires_at on at most once a minute and never for the sync-pending poll, which the source page now uses instead of reloading itself. A request that finds no session leads to /login?next=<page>, and the login returns there. instance-import.spec pins the fixture schema (4) now that the schema is at 5. Verified: make test 935/935, make e2e 25/25, make lint, make image-smoke, make handbook.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A session ends 60 minutes after its last request and 12 hours after the login at the latest; a request extends it at most once a minute, the sync poll of a source page not at all. After a login the user returns to the page they asked for. Migration 0005 rebuilds the sessions table, so everyone logs in once after the update. Verified with make test, make e2e, make lint, make image-smoke and make handbook.
<!-- SECTION:FINAL_SUMMARY:END -->

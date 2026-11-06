---
id: TASK-314
title: >-
  Import: report database errors of the target instance instead of calling the
  file no export
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 20:51'
updated_date: '2026-11-06 21:10'
labels:
  - ops
dependencies: []
references:
  - app/src/lib/server/instance-import.ts
  - scripts/import.ts
priority: medium
type: bug
ordinal: 376000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`importInstance` in `app/src/lib/server/instance-import.ts` maps every SQLite error (`code === 'ERR_SQLITE_ERROR'`, see `isSqliteError`) that happens after decryption to `{ error: 'not-an-export' }`. That includes errors of the target database: `BEGIN IMMEDIATE` timing out busy (errcode 5) when `scripts/import.ts` runs beside a running server, read-only (8), I/O error (10) and disk full (13). The operator then reads "The file is not a grimoire export." and re-exports a file that was fine. In `scripts/import.ts` the `failWhenBusy` handling can never fire for the import step itself. No spec covers this.

Suggested fix: in the catch, rethrow (or map to a distinct problem) when `errcode` is 5, 8, 10 or 13, and map only the remaining errors to `not-an-export`; make sure the setup page and `scripts/import.ts` show a fitting message for the rethrown case.

Found by a whole-repo audit on 2026-11-06 (commit 601c588 plus six local refactor commits).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An import while another connection holds the write lock does not report `not-an-export`; the script reports that the database is busy
- [x] #2 A malformed export that decrypts still reports `not-an-export`
- [x] #3 A spec holds the write lock on a second connection during an import
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: an import into a file database whose write lock another connection holds rejects with errcode 5 and writes nothing
2. importExport rethrows SQLite errors whose primary code is BUSY, READONLY, IOERR or FULL; the rest stay not-an-export
3. scripts/import.ts already passes a busy error to failWhenBusy
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before (answered not-an-export) and passes after; instance-import.spec.ts and the setup route specs pass (12 tests).
- Extended result codes are masked with 0xff, so SQLITE_IOERR_WRITE and friends count as IOERR.
- On the setup page such an error now ends in the server error page instead of the wrong file refusal; scripts/import.ts prints its existing busy message.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An import no longer reports a locked, read-only, broken or full instance database as "not a grimoire export": those SQLite errors are passed on, so scripts/import.ts prints its busy message and other callers see the real error. A file that decrypts but holds another schema is still refused as not-an-export. A spec holds the write lock from a second connection.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-314
title: >-
  Import: report database errors of the target instance instead of calling the
  file no export
status: To Do
assignee: []
created_date: '2026-11-06 20:51'
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
- [ ] #1 An import while another connection holds the write lock does not report `not-an-export`; the script reports that the database is busy
- [ ] #2 A malformed export that decrypts still reports `not-an-export`
- [ ] #3 A spec holds the write lock on a second connection during an import
<!-- AC:END -->

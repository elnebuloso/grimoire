---
id: TASK-282
title: Import copies only the exported columns
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:57'
updated_date: '2026-11-06 18:15'
labels:
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 344000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`copyRows` in `app/src/lib/server/instance-import.ts` builds its `INSERT` from the column names of the uploaded database and copies runtime columns too. The file is only as trusted as its passphrase; on `/setup` the uploader holds the setup token and gets an admin account anyway, so nothing is gained by an attacker today. A file that decrypts but has an unexpected schema ends in a 500 instead of `not-an-export`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `copyRows` copies only `EXPORTED_COLUMNS[table]`
- [x] #2 A decryptable file with an unexpected schema is refused as `not-an-export`, covered by a spec
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. copyRows selects and inserts only EXPORTED_COLUMNS[table]
2. A decrypted file below schema 4 (the first that exports), or one whose tables do not match, is refused as not-an-export; SQLite errors during migrate and copy become that refusal, nothing written
3. sealExport split out of writeExport, so specs can seal any database like an export
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Specs: a sealed database carrying runtime columns imports without them; a migrated database with a dropped column and a foreign database without schema version are refused as not-an-export. Both failed before the change.
- The export-schema-4 fixture still imports (existing spec).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The import copies only the exported columns of each table, and a file that decrypts but holds an unexpected schema (below the first exporting version, or tables that do not match) is refused as not-an-export instead of ending in a 500. Specs failed before and pass after; the schema-4 fixture still imports.
<!-- SECTION:FINAL_SUMMARY:END -->

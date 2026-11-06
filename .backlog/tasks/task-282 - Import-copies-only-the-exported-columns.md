---
id: TASK-282
title: Import copies only the exported columns
status: To Do
assignee: []
created_date: '2026-11-06 15:57'
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
- [ ] #1 `copyRows` copies only `EXPORTED_COLUMNS[table]`
- [ ] #2 A decryptable file with an unexpected schema is refused as `not-an-export`, covered by a spec
<!-- AC:END -->

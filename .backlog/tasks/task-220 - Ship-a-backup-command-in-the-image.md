---
id: TASK-220
title: Ship a backup command in the image
status: To Do
assignee: []
created_date: '2026-10-31 13:50'
labels:
  - ops
dependencies: []
priority: medium
type: enhancement
ordinal: 282000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The image has no `sqlite3` and no backup script, so `docs/handbook/database.md` gives operators a one-line `node -e` script using `node:sqlite` `backup` to take a consistent copy while grimoire runs. `scripts/reset-admin.ts` shows the pattern of a script shipped in the image. Found by the handbook audit in TASK-196.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The image contains a script, such as `scripts/backup.ts`, that writes a consistent copy of the database at `DATABASE_PATH` to a path given as argument while grimoire runs
- [ ] #2 It refuses an existing target file instead of overwriting it, and exits non-zero with a message on failure
- [ ] #3 A test covers a backup taken while another connection writes, and `make image-smoke` runs the script inside the image
- [ ] #4 `docs/handbook/database.md` uses the script with `docker exec` and `kubectl exec` instead of the `node -e` line
<!-- AC:END -->

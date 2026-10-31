---
id: TASK-220
title: Ship a backup command in the image
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:50'
updated_date: '2026-10-31 14:01'
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
- [x] #1 The image contains a script, such as `scripts/backup.ts`, that writes a consistent copy of the database at `DATABASE_PATH` to a path given as argument while grimoire runs
- [x] #2 It refuses an existing target file instead of overwriting it, and exits non-zero with a message on failure
- [x] #3 A test covers a backup taken while another connection writes, and `make image-smoke` runs the script inside the image
- [x] #4 `docs/handbook/database.md` uses the script with `docker exec` and `kubectl exec` instead of the `node -e` line
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/backup.ts: VACUUM INTO over a read-only connection (one read transaction, never restarts on concurrent writes, unlike the online backup API), refuses an existing target. 2. Spec spawning the script: committed state during an open write, existing target, missing argument. 3. Dockerfile copy, image-smoke runs it. 4. database.md uses the script.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
scripts/backup.ts writes a consistent copy of DATABASE_PATH to a given file with VACUUM INTO over a read-only connection: it reads in one transaction, so a running server neither blocks it nor puts half a write into it. It refuses an existing target and exits 1 with a message on any failure. backup-script.spec.ts covers a backup during an uncommitted write of another connection (copy holds the committed state only), an existing target left unchanged, and a missing argument. The image copies the script; make image-smoke runs it in grimoire:latest and checks the copy (passed). database.md shows docker exec/cp and kubectl exec/cp. make lint and make test (752) pass.
<!-- SECTION:FINAL_SUMMARY:END -->

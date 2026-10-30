---
id: TASK-109
title: Confirm that deleting a source during its sync does no damage
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
updated_date: '2026-10-30 03:42'
labels:
  - admin
  - sync
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/db/sources.ts
  - app/src/lib/server/sync/index.ts
priority: low
type: spike
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raised by a code review of the management area on 2026-10-30 as an open question; not examined.

What happens when a source, or its project, is deleted from the management area while a sync of that source is queued or running has not been checked. From reading the code the expectation is a logged error without damage: `sourceForSync` (`app/src/lib/server/db/sources.ts`) throws for a missing source, and the foreign keys reject the sync history row. Neither a stray index nor a crashed queue has been ruled out.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A test deletes a source (and separately its project) while its sync is queued or running and shows that the run ends without leaving pages, snippets or history rows of the deleted source, and that the queue keeps working
- [x] #2 Any damage found is fixed in the same task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Tests in `sync.spec.ts` against a local bare repository: delete the source before the check stage, the source before the sync stage, and the project before the sync stage (via the `lanes` option); delete a queued source and request another one through `createSyncQueue`. Assert no pages, snippets, links or sync history remain and the queue goes on.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Result, no damage found: a source or project deleted while its sync runs ends the run as `failed` (the writes hit the foreign keys) and leaves no pages, snippets, links or `sync_runs` rows. A source deleted while queued makes its run reject with 'source N does not exist', which `requestInBackground` logs; the next queued source syncs normally and nothing stays pending. No code change; the tests now pin this behaviour. make lint and make test (563) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Confirmed by four new tests in `sync.spec.ts`: deleting a source or its project during a sync ends the run as failed without leaving index rows or history behind, and deleting a queued source only makes its own run fail with a logged error while the queue keeps working. No damage, so no code change.
<!-- SECTION:FINAL_SUMMARY:END -->

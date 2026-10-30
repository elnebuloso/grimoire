---
id: TASK-109
title: Confirm that deleting a source during its sync does no damage
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
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
- [ ] #1 A test deletes a source (and separately its project) while its sync is queued or running and shows that the run ends without leaving pages, snippets or history rows of the deleted source, and that the queue keeps working
- [ ] #2 Any damage found is fixed in the same task
<!-- AC:END -->

---
id: TASK-332
title: 'Source form: refuse exclusion lines too long for matchesGlob'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - admin
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/admin/duplicates.ts
priority: medium
type: bug
ordinal: 394000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Exclusions are stored as one glob per line (`exclusionsJson` in `app/src/lib/server/admin/sources.ts`), without a length check in `sourceProblem`. Node's `path.matchesGlob` throws "pattern is too long" for a pattern over 65,536 characters (checked: 65,536 works, 65,537 throws).

Case: source A (path empty) and source B (path `docs`) share a repository. An admin pastes a line of more than 64 KiB into A's exclusions; the save succeeds (`sourceConflict` returns early when URL and path are unchanged). From then on every `/manage/*` page runs the layout load (`app/src/routes/manage/+layout.server.ts`) → `managementCounts` → `sourceOverlaps` → `matchesGlob` in `app/src/lib/server/admin/duplicates.ts` (around lines 85-87), which throws: every management page answers 500, including A's own settings page, so the UI cannot undo it; only a database edit can. A's sync fails on the same call in `listPages` (`app/src/lib/server/sync/index-source.ts`).

Suggested fix: in `sourceProblem`, refuse at the `exclusions` field any line longer than about 1,000 characters (new message key in every `app/messages/<locale>.json`).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Saving a source with an exclusion line over the limit is refused at the exclusions field and writes nothing
- [ ] #2 Normal exclusions save as before
- [ ] #3 A spec covers the refusal
<!-- AC:END -->

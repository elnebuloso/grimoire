---
id: TASK-145
title: Map source settings to form fields in one place
status: To Do
assignee: []
created_date: '2026-10-30 11:29'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30; worth doing when the next source setting is added, because that is when the cost shows. Each source setting is spelled out field by field in many places: `SourceRow`, `SOURCE_COLUMNS`, `toSettings` and the `INSERT`/`UPDATE` statements in `app/src/lib/server/admin/projects.ts` (around lines 152-185 and 355-380); `SourceRow` and `SyncSource` in `app/src/lib/server/db/sources.ts`; and a hand mapping from `data.source` to form fields in `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte` (around lines 31-43). The defaults for a new source already come from `NEW_SOURCE_FIELDS` in `app/src/lib/source-fields.ts`; the mapping of an existing source does not. A new setting today means about eight edits in four files, and a missed one in the Svelte mapping silently shows an empty field for a stored value.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A function next to `NEW_SOURCE_FIELDS` in `app/src/lib/source-fields.ts` turns a stored source into form fields, and the source page uses it instead of its own mapping
- [ ] #2 The source page shows the same values for an existing source as before, including empty docs URL, schedule and username
- [ ] #3 A test covers the mapping, including the optional fields
<!-- AC:END -->

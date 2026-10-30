---
id: TASK-145
title: Map source settings to form fields in one place
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 11:29'
updated_date: '2026-10-30 11:57'
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
- [x] #1 A function next to `NEW_SOURCE_FIELDS` in `app/src/lib/source-fields.ts` turns a stored source into form fields, and the source page uses it instead of its own mapping
- [x] #2 The source page shows the same values for an existing source as before, including empty docs URL, schedule and username
- [x] #3 A test covers the mapping, including the optional fields
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. source-fields.ts gets StoredSourceFields (the stored shape: nulls, exclusion list) and toSourceFields(source); SourceSettings in admin/projects.ts extends StoredSourceFields instead of repeating the fields.
2. The source page uses toSourceFields instead of its hand mapping.
3. Tests in source-fields.spec.ts; check by hand in the agent environment.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
toSourceFields in app/src/lib/source-fields.ts (next to NEW_SOURCE_FIELDS) turns a stored source into form fields; the source page uses it instead of its own nine-line mapping. The stored shape is StoredSourceFields in the same file, and SourceSettings in admin/projects.ts extends it, so its fields are no longer repeated there. Two new tests cover all fields and the optional ones stored as null or empty. Checked by hand in the agent environment: a source without optional settings shows empty fields, one with docs URL, two exclusions, schedule, paused and username shows them all (exclusions one per line), and "new" still shows branch main and path docs/; agent database reset afterwards. make lint and 181 related specs pass.
<!-- SECTION:FINAL_SUMMARY:END -->

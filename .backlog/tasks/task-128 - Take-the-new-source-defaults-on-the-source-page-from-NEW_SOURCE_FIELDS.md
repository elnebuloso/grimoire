---
id: TASK-128
title: Take the new-source defaults on the source page from NEW_SOURCE_FIELDS
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:46'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 190000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte` (lines 28-41) repeats the new-source defaults (`'main'`, `'docs/'` and the others) instead of using `NEW_SOURCE_FIELDS` from `app/src/lib/source-fields.ts` (line 16), which the project wizard uses. Changing a default in one place then makes the wizard and "New source" disagree.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source page takes its defaults for a new source from `NEW_SOURCE_FIELDS`; no default value is repeated there
- [ ] #2 The new-source form shows the same defaults as before
<!-- AC:END -->

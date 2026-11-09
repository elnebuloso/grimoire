---
id: TASK-128
title: Take the new-source defaults on the source page from NEW_SOURCE_FIELDS
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:13'
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
- [x] #1 The source page takes its defaults for a new source from `NEW_SOURCE_FIELDS`; no default value is repeated there
- [ ] #2 The new-source form shows the same defaults as before
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spread NEW_SOURCE_FIELDS when there is no source; map the existing source's fields otherwise.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page takes a new source's defaults from NEW_SOURCE_FIELDS, the same object the wizard uses; no default value is repeated in the page. Checked in the agent environment: 'new' shows branch main, path docs/, empty Git URL; an existing source shows its own values. make lint (including svelte-check) passes.
<!-- SECTION:FINAL_SUMMARY:END -->

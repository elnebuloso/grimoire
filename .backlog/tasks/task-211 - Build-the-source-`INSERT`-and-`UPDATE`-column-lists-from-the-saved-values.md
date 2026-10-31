---
id: TASK-211
title: Build the source `INSERT` and `UPDATE` column lists from the saved values
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:15'
labels:
  - admin
milestone: m-1
dependencies: []
priority: medium
type: chore
ordinal: 273000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `saveSource` (`app/src/lib/server/admin/sources.ts`, ~lines 256-298) the `values` object is already keyed by column name (`name`, `description`, `git_url`, `docs_url`, `branch`, `path`, `exclusions`, `sync_schedule`, `paused`, `public`, `username`), but the `INSERT INTO sources (...) VALUES (:...)` column and placeholder lists and the `UPDATE sources SET name = :name, ...` list repeat those keys by hand.

A column added to `values` and the `INSERT` but forgotten in the `UPDATE` saves when a source is created and is silently dropped on every edit. Because the SQL is a string, no type check notices. The other places a new source setting touches (`source-fields.ts`, `SourceRow`, `SOURCE_COLUMNS`, `toSettings`) are type-checked and can stay as they are.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The column and placeholder lists of the source `INSERT` and the `SET` list of the source `UPDATE` are built from the keys of `values`
- [x] #2 A test saves a source, edits every setting and reads all of them back changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In saveSource build the INSERT column/placeholder lists and the UPDATE SET list from Object.keys(values).
2. Spec: create a source, edit every setting, read all back changed.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
saveSource builds the INSERT column and placeholder lists and the UPDATE SET list from Object.keys(values), so a setting added to values reaches both statements. New spec 'changes every setting of a stored source' edits all eleven settings and reads them back. Affected specs pass (87 tests).
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-200
title: 'Admin overview: skip link, consistent actions and readable figures'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-31 00:17'
labels:
  - admin
  - impeccable
milestone: m-1
dependencies:
  - TASK-199
priority: low
type: enhancement
ordinal: 262000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Smaller findings of the Impeccable critique of `/manage`: a keyboard user needs about 15 tab stops through header and management nav before the first problem; "New source" is a plain text link while the comparable head action "Sync now" is a button; on child pages of the overview (a source page, `/manage/dead-links`) no item of the management nav is marked current; numbers are not grouped ("3222"); the "Last sync" column repeats year and time zone on every row; the yes/no "Sync error" column repeats what "Needs attention" already says.

Carried out by running `/impeccable polish /manage` (Impeccable skill), as the Action Summary of the critique recommends; the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every page has a skip link to its main content as the first focusable element, visible on focus
- [x] #2 "New source" looks and behaves like the other primary head actions
- [x] #3 On a source page and on `/manage/dead-links` the management nav marks the item they belong to
- [x] #4 Counts in the overview ledger and the sources table are grouped for the active language
- [x] #5 The sources table shows sync state as a word in one column, per `docs/DESIGN.md`, and "Last sync" no longer repeats the year and time zone on every row
- [x] #6 `make lint`, `make test` and `make e2e` pass, since the skip link reaches every page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Root layout: a skip link as first focusable element, visible on focus, to `<main id="main">`.
2. "New source" as `a.button.primary`; `app.css` gives `a.button.primary` the primary button look.
3. Management nav: Overview gets `aria-current="true"` and the raised look on `/manage/sources/*` and `/manage/dead-links`.
4. Counts grouped with the active locale in `DescriptionList` (numbers) and `SourceStatsTable`.
5. `SourceStatsTable`: a "Status" column with one word (failed, paused, not synced, synced) replaces the yes/no "Sync error" column; `SourceStats` gains `paused`. "Last sync" shows a short date and time without the zone, the zone moves into the column head. Orphaned `sync_error` key removed.
6. Update stories and specs; run `make lint`, `make test`, `make e2e`; look at start page and overview in light and dark.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified in the agent environment: the first Tab on `/manage` focuses "Skip to content" (`#main`), shown as a raised button; on `/manage/sources/3` the nav marks Overview with `aria-current="true"` and the raised look; the sources table reads failed / synced / paused, "Last sync (UTC)" with `10/30/26, 11:43 PM`, tokens grouped (`2,230`), in light and dark; "New source" is a primary button-link. The status word is chosen most pressing first: failed, paused, not synced, synced. Orphaned message keys `sync_error`, `yes`, `no` removed. After the last change: `make lint` clean, `make test` 714 passed, `make e2e` 23 passed (the start page test now reads the status word). The critique snapshot of `/manage` closed itself because the page changed (`critique-storage latest` exits 2).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Last pass of the `/manage` critique: a "Skip to content" link on every page; "New source" styled as the primary action like "Sync now"; the management nav keeps Overview current on source pages and the dead links; counts grouped for the active language in the ledger and the sources table; the yes/no "Sync error" column replaced by a "Status" word (failed, paused, not synced, synced) and "Last sync" shortened, with the time zone in its head. The table change reaches the public start page too. Full lint, unit/story and e2e suites pass.
<!-- SECTION:FINAL_SUMMARY:END -->

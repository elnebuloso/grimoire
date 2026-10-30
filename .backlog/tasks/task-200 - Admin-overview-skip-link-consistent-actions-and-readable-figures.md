---
id: TASK-200
title: 'Admin overview: skip link, consistent actions and readable figures'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-30 23:51'
labels:
  - admin
  - impeccable
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
- [ ] #1 Every page has a skip link to its main content as the first focusable element, visible on focus
- [ ] #2 "New source" looks and behaves like the other primary head actions
- [ ] #3 On a source page and on `/manage/dead-links` the management nav marks the item they belong to
- [ ] #4 Counts in the overview ledger and the sources table are grouped for the active language
- [ ] #5 The sources table shows sync state as a word in one column, per `docs/DESIGN.md`, and "Last sync" no longer repeats the year and time zone on every row
- [ ] #6 `make lint`, `make test` and `make e2e` pass, since the skip link reaches every page
<!-- AC:END -->

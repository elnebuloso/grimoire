---
id: TASK-198
title: 'Admin overview: name the fix for each sync problem under "Needs attention"'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-31 00:02'
labels:
  - admin
  - impeccable
dependencies:
  - TASK-197
priority: high
type: enhancement
ordinal: 260000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Impeccable critique of `/manage` found that a sync error shows its cause verbatim (e.g. `source path "archive/docs" does not exist in the repository`) but not what to do about it, and the list offers no direct way to the place where it is fixed. `docs/PRODUCT.md` makes "the cause and the fix, in words" a product principle, and the admin usually arrives on this page because a sync broke. Sync errors are stored today as English message strings from `app/src/lib/server/sync/`; how a known error is recognised is for the worker to decide.

Carried out by running `/impeccable clarify /manage` (Impeccable skill), as the Action Summary of the critique recommends; the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each known sync error (missing source path, branch not found, access refused, server unreachable, indexing deadline exceeded, no page indexed) shows a fix sentence under the cause in "Needs attention"
- [x] #2 An unknown error still shows its cause and a general next step, never nothing
- [x] #3 Each problem links to the place on the source page where it is fixed or inspected
- [x] #4 A source that never synced because its first sync failed is shown as one problem, not as "never synced" plus "sync error"
- [x] #5 Fix sentences exist in `app/messages/en.json` and `app/messages/de.json`; a spec covers recognising each known error and the unknown case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/sync/error-kind.ts`: `syncErrorKind(message)` recognises the stored sync error messages thrown in `sync/` (missing source path, branch not found, access refused, server unreachable, indexing deadline, indexing aborted, no page indexed) and returns a code, `unknown` otherwise; it reuses the refused pattern of `git.ts`. Spec with the real message shapes.
2. `status.ts`: an `error` problem carries its kind.
3. `/manage`: a fix sentence per kind under the cause (en and de), naming the labels of the source page; each item links to the section where it is fixed: `#settings` for errors and paused polling, `#status` for warnings and a missing first sync.
4. AC #4 (one problem for never synced plus error) was done in TASK-197; verify only.
5. Run the spec, `--changed`, `manage.e2e.ts`; check light and dark in the agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Recognition by pattern over the stored message (`app/src/lib/server/sync/error-kind.ts`), reusing `REFUSED` from `git.ts`; an extra kind `aborted` covers indexing that ended early (out of memory). Links: errors and paused polling go to `#settings`, warnings, dead links and a missing first sync to `#status` of the source page. Verified in the agent environment, light and dark: `billing-archive` shows the path fix. `error-kind.spec.ts` covers each kind and the unknown case; `make test TEST=--changed` (286 tests) and `manage.e2e.ts` pass. AC #4 came with TASK-197.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every sync error under "Needs attention" now names its fix below the cause, in en and de: `syncErrorKind()` sorts the stored message into missing path, branch, access, unreachable, deadline, aborted, no page, or unknown, and the overview shows the sentence for it, using the labels of the source page. Each item links to the section of the source page where it is fixed or inspected. Risk: recognition depends on the wording of the messages thrown in `app/src/lib/server/sync/`; a reworded message falls back to the general sentence, and the spec pins the current wording.
<!-- SECTION:FINAL_SUMMARY:END -->

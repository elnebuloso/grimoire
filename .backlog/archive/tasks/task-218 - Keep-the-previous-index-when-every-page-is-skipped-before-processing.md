---
id: TASK-218
title: Keep the previous index when every page is skipped before processing
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:44'
updated_date: '2026-10-31 13:44'
labels:
  - sync
milestone: m-1
dependencies: []
priority: high
type: bug
ordinal: 280000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When every Markdown file of a source is skipped before processing ("#" in the file name, or a symlink pointing outside the repository), `indexPages` gets no pages, does not throw, and the sync succeeds with an empty index that replaces the working one. Found while checking the handbook for TASK-196.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A sync whose found pages are all skipped before processing fails with `no page could be indexed, <last warning>` and keeps the previous index
- [x] #2 A regression test in `app/src/lib/server/sync/index-source.spec.ts` fails before the fix and passes after
- [x] #3 `docs/handbook/writing.md` and `docs/handbook/admin.md` describe the behaviour
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Regression test in index-source.spec.ts. 2. prepareCheckout throws the noPage error when files were listed but none read. 3. Adjust handbook wording. 4. make lint, test, e2e.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
prepareCheckout now throws `no page could be indexed, <last warning>` when it listed pages but skipped all of them ("#" in the name, symlink outside the repository), the same error and error kind (`noPage`) as indexPages; the sync fails and the previous index stays. Regression test added (failed before, passes after). writing.md and admin.md say a skipped page of any kind counts. make lint, make test (749) and make e2e (22) pass. Note: the UI hint admin_fix_no_page says "Fix the Markdown", which fits a renamed file loosely; left unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->

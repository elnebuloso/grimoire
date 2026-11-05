---
id: TASK-260
title: Same last sync and commit in source list and source page
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 22:53'
labels:
  - admin
  - sync
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: bug
ordinal: 322000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
For a source that never synced successfully the table shows a sync time while the source page says "never"; the history shows a commit while the status says "none" (finding U9). Admins cannot tell when content was last updated, which is the key question when something fails.

Measure M13 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The sources list labels its time column "Last check", the value the source page shows under the same label; the earlier decision to show the latest run there, unchanged runs included, stays (commit c0534f7)
- [x] #2 A source that never synced successfully shows no time labelled as a sync anywhere; the source page says "never" under "Last sync"
- [x] #3 The source page names the commit of its index "Indexed commit", apart from the commit of each run in the history
- [x] #4 A story covers a source that was checked but never synced successfully
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner decision 2026-11-05 (option a of three): rename instead of changing the value. The column read `last_checked_at` on purpose since commit c0534f7, so a source checked every few minutes without a new commit does not look stale; only its header said "Last sync". Rejected: showing `last_synced_at` again (brings that problem back) and both columns (too wide on a phone). Message keys: `last_sync_in_zone` became `last_check_in_zone`, new `source_indexed_commit`; the history keeps "Commit" per run. No e2e or handbook text names either label. make lint and the affected story file pass; full suites run before the commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
List and source page no longer contradict each other: the sources list heads its time column "Last check (<zone>)", which is what it always showed, the same value and word as on the source page, and the source page calls the commit of its index "Indexed commit". A never successfully synced source thus shows a check time but no sync time. New story "Checked, never synced" in `SourceStatsTable.stories.svelte`.
<!-- SECTION:FINAL_SUMMARY:END -->

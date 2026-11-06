---
id: TASK-259
title: Complete the needed actions and show the fix where it is done
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 08:47'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-256
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 321000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Duplicate sources appear neither under "Needs attention" nor on the source page; they are found only through their own menu entry. The hint how to fix a sync error shows on the overview but not on the source page where the fix happens (findings U10, U11). With hundreds of sources the list of needed actions has to stay readable (owner decision O6).

Measure M12 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Duplicates and overlaps appear under needed actions and as a hint on both sources
- [x] #2 The fix hint for a sync error shows on the source's Status sub page
- [x] #3 Needed actions are grouped by kind with a count and the first entries; "show all" leads to the filtered list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06; warnings decided: option a):
1. /manage groups needed actions by kind, in this order: sync errors, duplicates, warnings, dead links, paused, never synced.
2. Each group: heading with count, first 5 entries sorted by name; empty groups are left out; all empty keeps the "all fine" sentence.
3. Entry: SourceLabel (name, slug below); links where one acts: error and paused to the settings tab, everything else to the status tab (as fixAt today).
4. Content as today (error with FIX hint, warnings as list, dead link count); new: duplicates, one entry per pair (as findOverlaps counts for the sidebar), naming the other source.
5. "Show all" only with more than 5 entries: errors /manage/sources?status=error, paused ?status=paused, never synced ?status=never, dead links /manage/dead-links, duplicates /manage/duplicates, warnings /manage/sources?warnings=yes.
6. Warnings (decision a): SOURCE_LIST gets a filter warnings, sourceStats delivers the warning count, the source list gets a third select "Warnings: with warnings". sourceState stays unchanged.
7. Status tab: FIX hint under the sync error with a link to the settings tab; FIX moves out of app/src/routes/manage/+page.svelte to a shared place.
8. Status tab: duplicate or overlap hint on both sources, linking the status tab of the other one.
9. The "all syncs paused" notice stays at the top of /manage.
10. The list becomes the component AttentionList with stories: empty, all groups, more than 5, duplicates only.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. Problems carry a new kind duplicate (one per pair, from findOverlaps); groupProblems sorts each kind by name and keeps the first SHOWN_PER_GROUP (5). sourceStatus gains errorKind, the page load gains overlaps (overlapsOf). SourceStats gains a warnings count, so the start page data carries it too, like deadLinks already. Known gap: the paused group counts paused sources with a sync error too, while ?status=paused lists only those without one (sourceState puts error first); the same holds for counts vs. list there. Checked by hand in the agent environment, light and dark: groups, duplicate pair, fix hint with link to Settings, duplicate hint on platform-next, the warnings select.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Needed actions on /manage are grouped by kind (sync errors, duplicates, warnings, dead links, paused, never synced) with a count, the first five by name and "Show all" to the filtered list or quality list; duplicates and overlaps appear there and on the Status tab of both sources; the Status tab shows the fix hint under a sync error with a link to Settings. New: AttentionList with stories, SYNC_FIX in app/src/lib/sync-fix.ts, a warnings filter on the source list (?warnings=yes). make lint, make test (1051) and make e2e (28) pass.
<!-- SECTION:FINAL_SUMMARY:END -->

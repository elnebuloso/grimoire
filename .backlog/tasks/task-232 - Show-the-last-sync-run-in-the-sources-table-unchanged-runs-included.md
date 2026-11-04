---
id: TASK-232
title: 'Show the last sync run in the sources table, unchanged runs included'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-04 11:13'
updated_date: '2026-11-04 11:17'
labels:
  - sync
  - admin
dependencies: []
priority: medium
type: bug
ordinal: 294000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The "Last sync" column of `SourceStatsTable` (start page and `/manage`) reads `sources.last_synced_at`, which only a sync that swaps in a new index sets. Runs that find the commit unchanged leave it alone, so a source checked every few minutes for two days still shows the time of its last indexed commit. `sources.last_checked_at` is written by `recordCheck` on every run, whatever its outcome; the column should show that. `last_synced_at` stays as it is: it still decides "not synced".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The "Last sync" column shows the time of the most recent run (`last_checked_at`), including runs with outcome unchanged
- [x] #2 A source never run shows "never"; the state word "not synced" still follows `last_synced_at`
- [x] #3 stats.spec.ts covers a source whose last check is newer than its last indexed sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. stats.ts: add lastCheck (sources.last_checked_at) to SourceStats.
2. SourceStatsTable.svelte: date cell shows lastCheck.
3. stats.spec.ts: lastCheck in expectations plus regression test; stories fixtures.
4. Run stats spec, story, --changed; full lint/test/e2e before commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Agent environment after reset: start page shows billing-docs with its last_checked_at (11:17:15.478Z) while last_synced_at is still null. make lint, make test (803), make e2e (23) green. last_checked_at is taken when the check starts, so after a run that indexes it is a few seconds earlier than last_synced_at.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The sources table (start page, /manage) now shows sources.last_checked_at in the "Last sync" column, so runs that find nothing new move the time forward too. SourceStats gained lastCheck; lastSync still drives the "not synced" state. Regression test in stats.spec.ts; stories updated. A source on its first sync shows "not synced" next to the check time.
<!-- SECTION:FINAL_SUMMARY:END -->

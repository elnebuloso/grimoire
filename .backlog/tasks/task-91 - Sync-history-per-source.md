---
id: TASK-91
title: Sync history per source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:30'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
priority: low
type: feature
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source keeps only the state of its last sync: one error or a list of warnings. Since when a source has been failing, when its commit last changed, or whether a sync ran at all last night cannot be answered. That is the first question when a source stops being current.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every sync run of a source is recorded with start, end, outcome (unchanged, synced, failed), commit and error
- [x] #2 The source page lists the most recent runs
- [x] #3 Only a bounded number of runs per source is kept
- [x] #4 A deleted source takes its history with it
- [x] #5 Tests cover recording each outcome and the bound
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0016: sync_runs (source_id ON DELETE CASCADE, started_at, finished_at, outcome unchanged/synced/failed, commit_hash, error, runs).
2. db/sources.ts recordSyncRun: a run repeating the latest entry of the source (same outcome, commit and error, and not 'synced') extends that entry (finished_at, runs + 1) instead of adding one, so 5-minute polling keeps 'since when' answerable; otherwise inserts. Keeps the newest 100 entries per source. Skips a source deleted meanwhile.
3. sync.ts: syncSource records every run with its result.
4. status.ts: sourceStatus returns the runs, newest first; source page shows them in a table.
5. Tests: sync.spec (each outcome recorded by syncSource), sources/status spec (collapsing, bound, cascade on delete).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migration 0016 adds sync_runs. syncSource wraps the former body (now checkAndSync) and records every result with recordSyncRun. Repeats of the latest entry (unchanged at the same commit, failed with the same error) increment runs and move finished_at instead of inserting; synced runs always get their own row. 100 rows kept per source; ON DELETE CASCADE removes them with the source, and the INSERT ... SELECT skips a source deleted mid-sync. Verified: sources.spec (collapsing, separate syncs, 100-row bound, cascade and deleted source), sync.spec (synced, 2x unchanged, failed through syncSource), status.spec (history newest first), make lint, server tests 506 passed; by hand in the agent environment: fixture sources show synced and failed runs, a second 'Sync now' on billing/archive shows '2 runs'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every sync run of a source is recorded (start, end, outcome, commit, error) and listed as 'Sync history' on the source page, newest first. Repeated unchanged or failing runs are counted in one entry with first and last time, so 'since when' stays answerable under 5-minute polling; 100 entries per source are kept and they go with the source. Handbook updated. Verified with unit tests, make lint and by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
